const Joi = require('joi');

const JobPayloadSchema = Joi.object({
  company_id: Joi.string().required(),
  category_id: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  job_type: Joi.string().required(),          
  experience_level: Joi.string().required(),  
  location_type: Joi.string().required(),   
  location_city: Joi.string().required(),   
  salary_min: Joi.number().integer().required(), 
  salary_max: Joi.number().integer().required(),
  is_salary_visible: Joi.boolean().required(),  
  status: Joi.string().required(),      
});

module.exports = { JobPayloadSchema };