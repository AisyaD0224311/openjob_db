const Joi = require('joi');

const ApplicationPayloadSchema = Joi.object({
  job_id: Joi.string().required(),
});

const ApplicationStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'reviewed', 'accepted', 'rejected').required(),
});

module.exports = { ApplicationPayloadSchema, ApplicationStatusSchema };
