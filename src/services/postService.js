const prisma = require('../prisma/client');
const createError = require('http-errors');
const notificationService = require('./notificationService'); // Import để thông báo
const { emitToPost, emitToEvent, emitToUser } = require('../socket');

const checkEventAccess = async eventId => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { status: true, managerId: true, name: true }, // Lấy managerId, name để thông báo
  });

  if (!event) {
    throw createError(404, 'Không tìm thấy sự kiện');
  }

  // (QUAN TRỌNG) Chỉ cho phép tương tác nếu sự kiện đã được duyệt
  if (event.status !== 'APPROVED') {
    throw createError(403, 'Kênh trao đổi của sự kiện này chưa được kích hoạt');
  }

  return event; // Trả về event cho các hàm khác sử dụng
};

const listPostsForEvent = async (eventId, options, currentUser) => {
  // 1. Lấy thông tin sự kiện
  const event = await checkEventAccess(eventId);

  // 2. Kiểm tra xem User có phải là "Người tham gia" (Participant) không?
  // Điều kiện: Đã đăng ký VÀ trạng thái là CONFIRMED
  const registration = await prisma.eventRegistration.findFirst({
    where: {
      eventId: eventId,
      userId: currentUser.id,
      status: 'CONFIRMED',
    },
  });

  const isManager = event.managerId === currentUser.id;
  const isParticipant = !!registration; // True nếu tìm thấy đăng ký

  // 3. Xây dựng bộ lọc (WHERE)
  const where = {
    eventId,
    status: 'APPROVED', // Mặc định chỉ lấy bài đã duyệt
  };

  // --- LOGIC PHÂN QUYỀN HIỂN THỊ ---
  if (isManager) {
    // A. Nếu là Manager: Xem tất cả (Public + Private)
    // (Manager còn có thể lọc theo status PENDING như code cũ nếu muốn)
    if (options.status) where.status = options.status;

  } else if (isParticipant) {
    // B. Nếu là Người tham gia: Xem tất cả (Public + Private)
    // Không cần lọc visibility, xem được hết các bài APPROVED

  } else {
    // C. Nếu là Người ngoài (Chưa tham gia hoặc đang PENDING):
    // CHỈ XEM ĐƯỢC BÀI PUBLIC
    where.visibility = 'PUBLIC';
  }

  // ... (Code phân trang cũ giữ nguyên)
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
        medias: true,
        _count: { select: { comments: true, postLikes: true } },
        // Check xem user hiện tại đã like chưa
        postLikes: {
          where: { userId: currentUser.id },
          select: { id: true },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);

  // Map để thêm isLikedByCurrentUser và loại bỏ postLikes array thừa
  const postsWithLikeStatus = posts.map(post => {
    const { postLikes, ...rest } = post;
    return {
      ...rest,
      isLikedByCurrentUser: postLikes.length > 0,
    };
  });

  const totalPages = Math.ceil(total / limit);
  return { data: postsWithLikeStatus, pagination: { totalItems: total, totalPages, currentPage: page, limit } };
};

const createPost = async (eventId, userId, content, visibility = 'PUBLIC', mediaFiles = []) => {
  // 1. Kiểm tra sự kiện
  const event = await checkEventAccess(eventId);

  // 2. Xác định quyền hạn và trạng thái bài viết
  const isManager = event.managerId === userId;
  
  // Nếu là Manager -> Duyệt luôn (APPROVED). Nếu là Volunteer -> Chờ duyệt (PENDING)
  const initialStatus = isManager ? 'APPROVED' : 'PENDING';

  // 3. Chuẩn bị dữ liệu Media (nếu có)
  // mediaFiles là mảng file từ Multer/Cloudinary trả về
  // Cloudinary trả về secure_url hoặc url
  const mediasData = mediaFiles
    .filter((file) => file.secure_url || file.url || file.path)
    .map((file) => ({
      url: file.secure_url || file.url || file.path,
      type: file.mimetype.startsWith('image/') ? 'IMAGE' : 'VIDEO',
    }));

  // 4. Tạo Post và lưu vào DB (Dùng Nested Write để tạo luôn Media)
  const postData = {
    content,
    eventId,
    userId,
    status: initialStatus,
    visibility: visibility,
  };

  // Chỉ thêm medias nếu có file upload thành công
  if (mediasData.length > 0) {
    postData.medias = {
      create: mediasData,
    };
  }

  const newPost = await prisma.post.create({
    data: postData,
    include: {
      author: { select: { id: true, fullName: true, avatarUrl: true } },
      medias: true, // Trả về kèm danh sách media vừa tạo
    },
  });

  // 5. Gửi thông báo (Nếu là Volunteer đăng bài -> Báo cho Manager)
  if (!isManager) {
    // Gửi notification DB
    notificationService.createNotification(
      event.managerId,
      `"${newPost.author.fullName}" vừa đăng bài viết mới cần duyệt trong sự kiện "${event.name}".`,
      'POST', // Loại thông báo: Liên quan đến bài viết
      newPost.id
    ).catch(console.error);

    // Emit socket realtime cho Manager thấy ngay
    emitToUser(event.managerId, 'new_pending_post', {
      post: newPost,
      eventId,
      eventName: event.name,
      message: `"${newPost.author.fullName}" vừa đăng bài viết mới cần duyệt`,
    });
  }

  // 6. Emit socket nếu bài đã được duyệt (Manager đăng)
  if (initialStatus === 'APPROVED') {
    emitToEvent(eventId, 'new_post', { post: newPost });
  }

  return newPost;
};

const updatePostStatus = async (postId, managerId, status) => {
  // 1. Tìm bài post và Manager của sự kiện đó
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      userId: true, // Tác giả bài viết
      eventId: true, // Cần eventId để emit socket
      event: {
        select: { managerId: true, name: true },
      },
    },
  });

  if (!post) throw createError(404, 'Không tìm thấy bài viết');

  // 2. Kiểm tra quyền (Chỉ Manager của sự kiện mới được duyệt)
  if (post.event.managerId !== managerId) {
    throw createError(403, 'Bạn không có quyền duyệt bài viết này');
  }

  // 3. Cập nhật và lấy đầy đủ thông tin post
  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: { status },
    include: {
      author: { select: { id: true, fullName: true, avatarUrl: true } },
      medias: true,
      _count: { select: { comments: true, postLikes: true } },
    },
  });

  // 4. Gửi thông báo cho tác giả bài viết
  if (status === 'APPROVED') {
    notificationService
      .createNotification(
        post.userId,
        `Bài viết của bạn trong sự kiện "${post.event.name}" đã được duyệt và hiển thị.`,
        'POST',
        post.id,
      )
      .catch(console.error);

    // Emit socket: bài mới được duyệt -> hiển thị cho tất cả user trong event
    emitToEvent(post.eventId, 'new_post', { post: updatedPost });

    // Emit cho tác giả biết bài đã được duyệt
    emitToUser(post.userId, 'post_approved', {
      postId,
      eventName: post.event.name,
      message: 'Bài viết của bạn đã được duyệt!',
    });
  } else if (status === 'REJECTED') {
    notificationService
      .createNotification(
        post.userId,
        `Bài viết của bạn trong sự kiện "${post.event.name}" đã bị từ chối.`,
        'OTHER',
        null,
      )
      .catch(console.error);

    // Emit cho tác giả biết bài bị từ chối
    emitToUser(post.userId, 'post_rejected', {
      postId,
      eventName: post.event.name,
      message: 'Bài viết của bạn đã bị từ chối.',
    });
  }

  return updatedPost;
};

const deletePost = async (postId, user) => {
  // 1. Lấy post và thông tin sự kiện liên quan
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      userId: true, // ID của Tác giả (Author)
      eventId: true, // Cần eventId để emit socket
      event: {
        select: {
          managerId: true, // ID của Manager
        },
      },
    },
  });

  if (!post) {
    throw createError(404, 'Không tìm thấy bài post');
  }

  // 2. (QUAN TRỌNG) Logic Phân Quyền
  const isAuthor = post.userId === user.id;
  const isEventManager = post.event.managerId === user.id;
  const isAdmin = user.role === 'ADMIN';

  // Nếu user không phải 1 trong 3 vai trò này, từ chối
  if (!isAuthor && !isEventManager && !isAdmin) {
    throw createError(403, 'Bạn không có quyền xóa bài post này');
  }

  // 3. Thực hiện xóa
  await prisma.post.delete({
    where: { id: postId },
  });

  // 4. Emit socket realtime để các user khác thấy bài đã bị xóa
  emitToEvent(post.eventId, 'delete_post', { postId });

  return; // Hoàn thành
};

const togglePostLike = async (postId, userId) => {
  // 1. Kiểm tra sự kiện có tồn tại và APPROVED không
  // (Chúng ta phải làm 2 bước: tìm post, rồi tìm event của nó)

  const post = await verifyPostAccessibility(postId, userId);

  if (!post) {
    throw createError(404, 'Không tìm thấy bài post');
  }
  // Tái sử dụng hàm checkEventAccess để đảm bảo post thuộc 1 event HỢP LỆ
  const event = await checkEventAccess(post.eventId);

  // 2. Tìm kiếm Like hiện có (dùng composite key)
  const existingLike = await prisma.postLike.findUnique({
    where: {
      userId_postId: {
        // Đây là key được định nghĩa bởi @@unique([userId, postId])
        userId: userId,
        postId: postId,
      },
    },
  });

  // 3. (LOGIC TOGGLE)
  if (existingLike) {
    // Đã Like -> Bây giờ Unlike
    await prisma.postLike.delete({
      where: { id: existingLike.id },
    });

    // Đếm lại số like
    const likeCount = await prisma.postLike.count({
      where: { postId },
    });

    // Emit socket
    emitToPost(postId, 'post_like_update', {
      postId,
      liked: false,
      userId,
      likeCount,
    });

    return { liked: false, message: 'Đã hủy like' };
  } else {
    // Chưa Like -> Bây giờ Like
    await prisma.postLike.create({
      data: {
        userId: userId,
        postId: postId,
      },
    });

    // Đếm lại số like
    const likeCount = await prisma.postLike.count({
      where: { postId },
    });

    // 4. 🔔 (TÍNH NĂNG NÂNG CAO) Gửi thông báo cho tác giả
    // (Chỉ gửi nếu người like không phải là tác giả)
    if (post.userId && post.userId !== userId) {
      notificationService
        .createNotification(
          post.userId, // Gửi cho tác giả bài post
          `Ai đó vừa thích bài đăng của bạn trong sự kiện "${event.name}".`,
          'POST',
          post.id,
        )
        .catch(console.error);
    }

    // Emit socket
    emitToPost(postId, 'post_like_update', {
      postId,
      liked: true,
      userId,
      likeCount,
    });

    return { liked: true, message: 'Đã like bài post' };
  }
};

const getTopInteractedPosts = async (eventId = null, limit = 5, currentUser = null) => {
  // 1. Điều kiện cơ bản: Phải là bài đã duyệt
  const where = {
    status: 'APPROVED',
  };

  // --- LOGIC PHÂN QUYỀN HIỂN THỊ TRENDING ---

  if (!eventId) {
    // TRƯỜNG HỢP 1: Lấy Global Trending (Trang chủ)
    // -> Bắt buộc chỉ lấy bài PUBLIC để an toàn tuyệt đối
    where.visibility = 'PUBLIC';
  
  } else {
    // TRƯỜNG HỢP 2: Lấy Trending của 1 Event cụ thể
    where.eventId = eventId;

    let canViewPrivate = false;

    // Nếu user đã đăng nhập, kiểm tra xem họ có quyền xem bài Private không
    if (currentUser) {
      // Kiểm tra Manager
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (event && event.managerId === currentUser.id) {
        canViewPrivate = true;
      } else {
        // Kiểm tra Participant
        const registration = await prisma.eventRegistration.findFirst({
          where: {
            eventId: eventId,
            userId: currentUser.id,
            status: 'CONFIRMED',
          },
        });
        if (registration) canViewPrivate = true;
      }
    }

    // Nếu KHÔNG có quyền xem Private -> Gán cứng điều kiện chỉ lấy PUBLIC
    if (!canViewPrivate) {
      where.visibility = 'PUBLIC';
    }
    // Nếu có quyền (canViewPrivate = true) -> Không gán where.visibility -> Lấy cả 2
  }

  // 2. Truy vấn
  const posts = await prisma.post.findMany({
    where,
    take: limit,
    orderBy: [
      { postLikes: { _count: 'desc' } },
      { comments: { _count: 'desc' } },
    ],
    include: {
      author: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
      event: {
        select: { id: true, name: true },
      },
      medias: true,
      _count: {
        select: { comments: true, postLikes: true },
      },
    },
  });

  return posts;
};

const verifyPostAccessibility = async (postId, userId) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      event: true, // Lấy thông tin Event để check Manager
    },
  });

  if (!post) throw createError(404, 'Không tìm thấy bài viết');
  
  // Kiểm tra trạng thái Event (Post chỉ hiện khi Event APPROVED)
  if (post.event.status !== 'APPROVED') {
     // Trừ khi người xem là Manager của Event đó
     if (post.event.managerId !== userId) {
        throw createError(403, 'Sự kiện này chưa được kích hoạt');
     }
  }

  // --- LOGIC PUBLIC / PRIVATE ---
  if (post.visibility === 'PRIVATE') {
    // Nếu là Private, phải kiểm tra danh tính
    const isManager = post.event.managerId === userId;
    
    // Check Participant
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        eventId: post.event.id,
        userId: userId,
        status: 'CONFIRMED',
      },
    });

    if (!isManager && !registration) {
      throw createError(403, 'Đây là bài viết nội bộ, bạn cần tham gia sự kiện để xem.');
    }
  }

  return post; // Trả về post nếu hợp lệ
};

module.exports = {
  listPostsForEvent,
  createPost,
  deletePost,
  togglePostLike,
  updatePostStatus,
  getTopInteractedPosts,
  verifyPostAccessibility,
};
