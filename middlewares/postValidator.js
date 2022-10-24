import { check, validationResult } from "express-validator";

export const postValidator = [
  check("title").trim().not().isEmpty().withMessage("Post title is missing!"),
  check("content")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Post content is missing!"),
  check("meta").trim().not().isEmpty().withMessage("Post meta is missing!"),
  check("slug").trim().not().isEmpty().withMessage("Post slug is missing!"),
  check("tags")
    .isArray()
    .withMessage("Post tags must to be array of strings")
    .custom((tags) => {
      for (let tag of tags)
        if (typeof tag !== "string")
          return Error("Post tags must to be array of strings");
      return true;
    }),
];

export const validate = (req, res, next) => {
  const error = validationResult(req).array();
  if (error.length) return res.status(401).json({ error: error[0].msg });

  next();
};
