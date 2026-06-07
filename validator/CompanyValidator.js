const Joi = require('joi');

const CompanyPayloadSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null).optional(),
  location: Joi.string().allow('', null).optional(),
});

module.exports = { CompanyPayloadSchema };
