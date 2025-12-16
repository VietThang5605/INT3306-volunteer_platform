// src/services/commentService.js
const prisma = require('../prisma/client');
const createError = require('http-errors');
const notificationService = require('./notificationService');
const { verifyPostAccessibility } = require('./postService');

const listCommentsForPost = async (postId, options, userId) => {
  // 1. Check quyền xem bài viết
  await verifyPostAccessibility(postId, userId);

  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // 2. Query
  // CHỈ LẤY COMMENT GỐC (parentId = null)
  // Các reply sẽ được lấy lồng bên trong (nested include)
  const where = {
    postId,
    parentId: null, 
  };

  const [comments, total] = await prisma.$transaction([
    prisma.comment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
        // 🔽 Lấy kèm Replies
        replies: {
          orderBy: { createdAt: 'asc' }, // Reply cũ nhất lên trước (giống Facebook)
          include: {
            author: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);
  return { data: comments, pagination: { totalItems: total, totalPages, currentPage: page, limit } };
};

const createComment = async (postId, userId, content, parentId = null) => {
  // 1. Check quyền
  const post = await verifyPostAccessibility(postId, userId);

  // 2. Nếu là Reply, kiểm tra comment cha có tồn tại không
  let parentComment = null;
  if (parentId) {
    parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
    });

    if (!parentComment) throw createError(404, 'Bình luận gốc không tồn tại');
    
    // Validate: Comment cha phải thuộc cùng 1 bài post
    if (parentComment.postId !== postId) {
      throw createError(400, 'Bình luận cha không thuộc bài viết này');
    }
    
    // (Tùy chọn) Chặn reply lồng nhau quá sâu (chỉ cho phép 2 cấp: Gốc -> Reply)
    // Nếu comment cha đã có parentId -> Gán parentId về comment gốc nhất (Flat Reply)
    if (parentComment.parentId) {
       parentId = parentComment.parentId; 
    }
  }

  // 3. Tạo Comment
  const newComment = await prisma.comment.create({
    data: {
      content,
      postId,
      userId,
      parentId, // Lưu parentId
    },
    include: {
      author: { select: { id: true, fullName: true, avatarUrl: true } },
    },
  });

  // 4. Gửi thông báo
  // TH1: Nếu là Reply -> Báo cho người viết comment gốc
  if (parentId && parentComment.userId !== userId) {
    notificationService.createNotification(
      parentComment.userId,
      `"${newComment.author.fullName}" đã trả lời bình luận của bạn.`,
      'COMMENT_REPLY',
      postId // Link về bài post
    ).catch(console.error);
  }
  
  // TH2: Nếu comment vào bài viết (không phải reply chính mình) -> Báo cho chủ bài viết
  // (Logic cũ giữ nguyên, nhưng cần check để tránh spam noti nếu chủ bài viết cũng là người comment gốc)
  if (post.userId !== userId && (!parentId || parentComment.userId !== post.userId)) {
     notificationService.createNotification(
      post.userId,
      `"${newComment.author.fullName}" đã bình luận về bài viết của bạn.`,
      'POST_COMMENT',
      postId
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
  const post = await verifyPostAccessibility(comment.postId, userId);

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