// src/services/categoryService.js
const prisma = require('../prisma/client');
const createError = require('http-errors');

/**
 * (Public) Lấy tất cả danh mục
 */
const listCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc',
    },
  });
  return categories;
};

/**
 * (Admin) Tạo danh mục mới
 */
const createCategory = async (data) => {
  // Kiểm tra tên đã tồn tại chưa
  const existing = await prisma.category.findUnique({
    where: { name: data.name },
  });
  if (existing) {
    throw createError(409, 'Tên danh mục đã tồn tại');
  }

  const category = await prisma.category.create({
    data,
  });
  return category;
};

/**
 * (Admin) Cập nhật danh mục
 */
const updateCategory = async (categoryId, data) => {
  // Kiểm tra ID tồn tại
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    throw createError(404, 'Không tìm thấy danh mục');
  }

  // Nếu đổi tên, kiểm tra tên mới đã tồn tại chưa
  if (data.name && data.name !== category.name) {
    const existing = await prisma.category.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw createError(409, 'Tên danh mục đã tồn tại');
    }
  }

  const updatedCategory = await prisma.category.update({
    where: { id: categoryId },
    data,
  });
  return updatedCategory;
};

/**
 * (Admin) Xóa danh mục
 */
const deleteCategory = async (categoryId) => {
  // Kiểm tra ID tồn tại
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    throw createError(404, 'Không tìm thấy danh mục');
  }
  
  // (Lưu ý: Schema đã set onDelete: SetNull cho Event)
  await prisma.category.delete({
    where: { id: categoryId },
  });
  return;
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};