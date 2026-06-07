const Joi = require('joi');

const validationMiddleware = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      // Gunakan instanceof untuk deteksi error Joi yang lebih reliable
      if (error instanceof Joi.ValidationError) {
        return res.status(400).json({
          status: 'fail',
          message: error.details.map(d => d.message).join(', '),
        });
      }
      return next(error);
    }
    next();
  };
};

module.exports = validationMiddleware;
