const Joi = require('joi');
// eslint-disable-next-line no-unused-vars
const PasswordComplexity = require('joi-password-complexity');

const exportSchema = Joi.object({
  format: Joi.string().valid('json', 'csv', 'xlsx').default('json'), // 👈 Thêm 'xlsx'
});

module.exports = {
  exportSchema,
};