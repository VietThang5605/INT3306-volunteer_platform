const postService = require('../services/postService');

const getPosts = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const options = req.query;
    const currentUser = req.user; // 👈 Lấy user hiện tại

    // Truyền user vào service để xử lý logic hiển thị bài Pending
    const result = await postService.listPostsForEvent(eventId, options, currentUser);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user.id;
    
    const { content, visibility } = req.body; 
    const files = req.files || [];

    const newPost = await postService.createPost(eventId, userId, content, visibility, files);
    
    res.status(201).json(newPost);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id: postId } = req.params;
    const managerId = req.user.id;
    const { status } = req.body;

    const result = await postService.updatePostStatus(postId, managerId, status);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { id: postId } = req.params; // 1. Lấy ID bài post
    const user = req.user;             // 2. Lấy toàn bộ thông tin user

    await postService.deletePost(postId, user);
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const togglePostLike = async (req, res, next) => {
  try {
    const { id: postId } = req.params; // 1. Lấy ID bài post
    const userId = req.user.id;       // 2. Lấy ID user

    const result = await postService.togglePostLike(postId, userId);
    
    // Trả về trạng thái (liked: true/false) để frontend cập nhật
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getTrendingGlobal = async (req, res, next) => {
  try {
    const result = await postService.getTopInteractedPosts(null, 10, null);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getTrendingByEvent = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const currentUser = req.user;

    const result = await postService.getTopInteractedPosts(eventId, 10, currentUser);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosts,
  createPost,
  deletePost,
  togglePostLike,
  updateStatus,
  getTrendingGlobal,
  getTrendingByEvent,
};