export const parseData = (req, res, next) => {
  const { tags, thumbnail } = req.body;
  if (tags) req.body.tags = JSON.parse(tags);
  if (thumbnail) req.body.thumbnail = JSON.parse(thumbnail);

  next();
};
