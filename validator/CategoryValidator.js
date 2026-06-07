const Joi = require('joi');

const CategoryPayloadSchema = Joi.object({
  name: Joi.string().max(50).required(),
});

module.exports = { CategoryPayloadSchema };
