const Joi = require('joi');

const JobPayloadSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  company_id: Joi.string().required(),
  category_id: Joi.string().required(),
});

module.exports = { JobPayloadSchema };
