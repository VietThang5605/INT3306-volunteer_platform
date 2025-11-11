const prisma = require('../prisma/client');
const createError = require('http-errors');
const notificationService = require('./notificationService'); // Import để thông báo

const checkEventAccess = async (eventId) => {
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

const listPostsForEvent = async (eventId, options) => {
  // 1. Kiểm tra sự kiện có tồn tại và APPROVED không
  await checkEventAccess(eventId);

  // 2. (Code phòng thủ) Phân trang
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const take = limit;

  // 3. Lấy data và tổng số lượng
  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where: { eventId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { // Lấy thông tin người đăng
          select: { id: true, fullName: true, avatarUrl: true },
        },
        _count: { // (Nâng cao) Đếm số lượng like và comment
          select: { comments: true, postLikes: true },
        },
      },
    }),
    prisma.post.count({ where: { eventId } }),
  ]);

  const totalPages = Math.ceil(total / limit);
  return {
    data: posts,
    pagination: { totalItems: total, totalPages, currentPage: page, limit },
  };
};

const createPost = async (eventId, userId, content) => {
  // 1. Kiểm tra sự kiện (lấy ra managerId và eventName)
  const event = await checkEventAccess(eventId);

  // 2. Tạo post
  const newPost = await prisma.post.create({
    data: {
      content,
      eventId,
      userId, // Gán tác giả
    },
    include: {
      author: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
    },
  });

  // 3. (Nâng cao) Gửi thông báo "fire-and-forget" cho Manager
  // (Chỉ gửi nếu người đăng không phải là Manager)
  if (event.managerId && event.managerId !== userId) {
    notificationService.createNotification(
      event.managerId,
      `Có bài đăng mới trong sự kiện "${event.name}"`,
      'POST',
      newPost.id
    ).catch(console.error);
  }

  return newPost;
};

const deletePost = async (postId, user) => {
  // 1. Lấy post và thông tin sự kiện liên quan
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      userId: true, // ID của Tác giả (Author)
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

  return; // Hoàn thành
};

const togglePostLike = async (postId, userId) => {
  // 1. Kiểm tra sự kiện có tồn tại và APPROVED không
  // (Chúng ta phải làm 2 bước: tìm post, rồi tìm event của nó)
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { eventId: true, userId: true }, // Lấy eventId và authorId
  });

  if (!post) {
    throw createError(404, 'Không tìm thấy bài post');
  }
  // Tái sử dụng hàm checkEventAccess để đảm bảo post thuộc 1 event HỢP LỆ
  const event = await checkEventAccess(post.eventId);

  // 2. Tìm kiếm Like hiện có (dùng composite key)
  const existingLike = await prisma.postLike.findUnique({
    where: {
      userId_postId: { // Đây là key được định nghĩa bởi @@unique([userId, postId])
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
    return { liked: false, message: 'Đã hủy like' };
  } else {
    // Chưa Like -> Bây giờ Like
    // eslint-disable-next-line no-unused-vars
    const newLike = await prisma.postLike.create({
      data: {
        userId: userId,
        postId: postId,
      },
    });

    // 4. 🔔 (TÍNH NĂNG NÂNG CAO) Gửi thông báo cho tác giả
    // (Chỉ gửi nếu người like không phải là tác giả)
    if (post.userId && post.userId !== userId) {
      notificationService.createNotification(
        post.userId, // Gửi cho tác giả bài post
        `Ai đó vừa thích bài đăng của bạn trong sự kiện "${event.name}".`,
        'POST',
        post.id
      ).catch(console.error);
    }
    
    return { liked: true, message: 'Đã like bài post' };
  }
};

module.exports = {
  listPostsForEvent,
  createPost,
  deletePost,
  togglePostLike,
};