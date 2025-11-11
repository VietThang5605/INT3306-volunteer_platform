// src/services/commentService.js
const prisma = require('../prisma/client');
const createError = require('http-errors');
const notificationService = require('./notificationService');

const checkPostAccess = async (postId) => {
  // 1. Tìm Post và Event
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      userId: true, // ID tác giả Post
      event: {
        select: {
          status: true,
          name: true, // Tên sự kiện
        },
      },
    },
  });

  // 2. Kiểm tra
  if (!post || !post.event) {
    throw createError(404, 'Không tìm thấy bài post hoặc sự kiện liên quan');
  }
  if (post.event.status !== 'APPROVED') {
    throw createError(403, 'Không thể tương tác với bài post của sự kiện chưa được duyệt');
  }
  
  return post; // Trả về post (chứa authorId) và event (chứa name)
};

const listCommentsForPost = async (postId, options) => {
  // 1. Kiểm tra Post và Event có hợp lệ không
  await checkPostAccess(postId);

  // 2. (Code phòng thủ) Phân trang
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const take = limit;

  // 3. Lấy data và tổng số lượng
  const [comments, total] = await prisma.$transaction([
    prisma.comment.findMany({
      where: { postId },
      skip,
      take,
      orderBy: { createdAt: 'asc' }, // Comment thường sắp xếp từ cũ đến mới
      include: {
        author: { // Lấy thông tin người bình luận
          select: { id: true, fullName: true, avatarUrl: true },
        },
        _count: { // Đếm số lượng like
          select: { commentLikes: true },
        },
      },
    }),
    prisma.comment.count({ where: { postId } }),
  ]);

  const totalPages = Math.ceil(total / limit);
  return {
    data: comments,
    pagination: { totalItems: total, totalPages, currentPage: page, limit },
  };
};

const createComment = async (postId, userId, content) => {
  // 1. Kiểm tra Post và Event (lấy ra authorId, eventName)
  const post = await checkPostAccess(postId);

  // 2. Tạo comment
  const newComment = await prisma.comment.create({
    data: {
      content,
      postId,
      userId,
    },
    include: {
      author: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
    },
  });

  // 3. 🔔 (TÍNH NĂNG NÂNG CAO) Gửi thông báo cho tác giả bài Post
  // (Chỉ gửi nếu người bình luận không phải là tác giả)
  if (post.userId && post.userId !== userId) {
    notificationService.createNotification(
      post.userId, // Gửi cho tác giả bài post
      `"${newComment.author.fullName}" vừa bình luận bài đăng của bạn trong sự kiện "${post.event.name}".`,
      'POST',
      postId // Link đến bài post
    ).catch(console.error);
  }

  return newComment;
};

const deleteComment = async (commentId, user) => {
  // 1. Lấy comment và thông tin sự kiện cha
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      userId: true, // ID của Tác giả (Author)
      post: {
        select: {
          event: {
            select: {
              managerId: true, // ID của Manager
            },
          },
        },
      },
    },
  });

  if (!comment || !comment.post || !comment.post.event) {
    throw createError(404, 'Không tìm thấy bình luận');
  }

  // 2. (QUAN TRỌNG) Logic Phân Quyền (Giống hệt post)
  const isAuthor = comment.userId === user.id;
  const isEventManager = comment.post.event.managerId === user.id;
  const isAdmin = user.role === 'ADMIN';

  if (!isAuthor && !isEventManager && !isAdmin) {
    throw createError(403, 'Bạn không có quyền xóa bình luận này');
  }

  // 3. Thực hiện xóa
  await prisma.comment.delete({
    where: { id: commentId },
  });

  return; // Hoàn thành
};

const toggleCommentLike = async (commentId, userId) => {
  // 1. Tìm comment để lấy postId và authorId (của comment)
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { postId: true, userId: true },
  });

  if (!comment) {
    throw createError(404, 'Không tìm thấy bình luận');
  }

  // 2. (QUAN TRỌNG) Kiểm tra an toàn
  // Tái sử dụng `checkPostAccess` để đảm bảo sự kiện cha là APPROVED
  const post = await checkPostAccess(comment.postId);

  // 3. Tìm kiếm Like hiện có
  const existingLike = await prisma.commentLike.findUnique({
    where: {
      userId_commentId: { // Composite key
        userId: userId,
        commentId: commentId,
      },
    },
  });

  // 4. (LOGIC TOGGLE)
  if (existingLike) {
    // Đã Like -> Bây giờ Unlike
    await prisma.commentLike.delete({
      where: { id: existingLike.id },
    });
    return { liked: false, message: 'Đã hủy like' };
  } else {
    // Chưa Like -> Bây giờ Like
    // eslint-disable-next-line no-unused-vars
    const newLike = await prisma.commentLike.create({
      data: {
        userId: userId,
        commentId: commentId,
      },
    });

    // 5. 🔔 (Nâng cao) Gửi thông báo cho tác giả bình luận
    if (comment.userId && comment.userId !== userId) {
      notificationService.createNotification(
        comment.userId, // Gửi cho tác giả bình luận
        `Ai đó vừa thích bình luận của bạn trong sự kiện "${post.event.name}".`,
        'POST', // Vẫn link về bài POST
        post.id
      ).catch(console.error);
    }
    
    return { liked: true, message: 'Đã like bình luận' };
  }
};

module.exports = {
  listCommentsForPost,
  createComment,
  deleteComment,
  toggleCommentLike,
};