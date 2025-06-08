import Joi from "joi";

export const validateCreatePost = (data) => {
  const schema = Joi.object({
    content: Joi.string().min(3).max(50).required(),
    mediaIds: Joi.array(),
  });

  return schema.validate(data);
};
