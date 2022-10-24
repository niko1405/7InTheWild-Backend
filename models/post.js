import mongoose from "mongoose";

const postSchema = mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  meta: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, unique: true },
  tags: [String],
  author: { type: String, default: "Admin" },
  thumbnail: {
    type: Object,
    url: { type: URL, required: true },
    public_id: { type: String, required: true },
  },
  createdAt: { type: String, required: true },
});

export default mongoose.model("Post", postSchema);
