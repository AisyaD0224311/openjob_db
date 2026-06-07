const Joi = require('joi');

const UserPayloadSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(), 
  role: Joi.string().required(),           
});

module.exports = { UserPayloadSchema };