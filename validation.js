/*
 * HTX Bình Mỹ — Validation schemas (Joi)
 */

const Joi = require('joi');

const ALLOWED_CATEGORIES = ['Củ', 'Lúa gạo', 'Rau củ', 'Trái cây', 'Đặc sản'];

const productCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Tên sản phẩm không được rỗng',
    'string.max': 'Tên sản phẩm tối đa 200 ký tự',
    'any.required': 'Thiếu tên sản phẩm'
  }),
  category: Joi.string().valid(...ALLOWED_CATEGORIES).required().messages({
    'any.only': `Category phải là một trong: ${ALLOWED_CATEGORIES.join(', ')}`,
    'any.required': 'Thiếu category'
  }),
  price: Joi.number().min(0).max(100000000).required().messages({
    'number.min': 'Giá phải >= 0',
    'any.required': 'Thiếu giá'
  }),
  unit: Joi.string().trim().max(20).default('kg'),
  description: Joi.string().max(2000).allow('').default(''),
  stock: Joi.number().integer().min(0).max(1000000).default(0),
  vietgap: Joi.boolean().default(true),
  image: Joi.string().trim().max(500).allow('').default('')
});

const productUpdateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200),
  category: Joi.string().valid(...ALLOWED_CATEGORIES),
  price: Joi.number().min(0).max(100000000),
  unit: Joi.string().trim().max(20),
  description: Joi.string().max(2000).allow(''),
  stock: Joi.number().integer().min(0).max(1000000),
  vietgap: Joi.boolean(),
  image: Joi.string().trim().max(500).allow('')
}).min(1).messages({
  'object.min': 'Cần ít nhất 1 trường để cập nhật'
});

const loginSchema = Joi.object({
  username: Joi.string().trim().min(1).max(100).required(),
  password: Joi.string().min(1).max(200).required()
});

const productQuerySchema = Joi.object({
  q: Joi.string().trim().max(200).allow(''),
  category: Joi.string().valid(...ALLOWED_CATEGORIES).allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

module.exports = {
  productCreateSchema, productUpdateSchema, loginSchema, productQuerySchema,
  ALLOWED_CATEGORIES
};
