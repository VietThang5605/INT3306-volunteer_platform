const Joi = require('joi');

const subscribeSchema = Joi.object({
  subscription: Joi.object({
    endpoint: Joi.string().uri().required(),
    expirationTime: Joi.any().allow(null), // Browser có thể gửi field này
    keys: Joi.object({
      p256dh: Joi.string().required(),
      auth: Joi.string().required(),
    }).required(),
  }).required(),
});

const unsubscribeSchema = Joi.object({
  endpoint: Joi.string().uri().required(),
});

module.exports = {
  subscribeSchema,
  unsubscribeSchema,
};
