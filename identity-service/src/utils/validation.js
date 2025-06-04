import Joi from "joi";

export const validateRegistration = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(50).required(),
  });

  return schema.validate(data);
};
