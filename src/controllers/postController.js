const postService = require('../services/postService');

const getPosts = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const options = req.query; // Đã được Joi validate
    
    const result = await postService.listPostsForEvent(eventId, options);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user.id;
    const { content } = req.body; // Đã được Joi validate

    const newPost = await postService.createPost(eventId, userId, content);
    
    res.status(201).json(newPost);
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
module.exports = {
  getPosts,
  createPost,
  deletePost,
  togglePostLike,
};