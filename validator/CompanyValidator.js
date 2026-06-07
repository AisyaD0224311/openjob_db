const Joi = require('joi');

const CompanyPayloadSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(), 
  location: Joi.string().required(),  
});

module.exports = { CompanyPayloadSchema };