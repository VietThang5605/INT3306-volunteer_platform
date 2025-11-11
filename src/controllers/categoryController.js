// src/controllers/categoryController.js
const { categoryService }= require('../services/index');

/**
 * @desc    Lấy tất cả danh mục
 * @route   GET /api/v1/categories
 * @access  Public
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.listCategories();
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    (Admin) Tạo danh mục mới
 * @route   POST /api/v1/categories
 * @access  Admin
 */
const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    (Admin) Cập nhật danh mục
 * @route   PATCH /api/v1/categories/:id
 * @access  Admin
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await categoryService.updateCategory(parseInt(id, 10), req.body);
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    (Admin) Xóa danh mục
 * @route   DELETE /api/v1/categories/:id
 * @access  Admin
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(parseInt(id, 10));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};