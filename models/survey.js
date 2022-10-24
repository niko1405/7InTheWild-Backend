import mongoose from "mongoose";

const surveySchema = mongoose.Schema({
  createdAt: { type: String, require: true },
  userId: { type: String, require: true },
  userName: { type: String, require: true },
  uri: { type: String, require: true },
  question: { type: String, require: true },
  message: { type: String, require: true },
  options: { type: Array, require: true },
  likes: { type: Array, require: true },
  comments: { type: Array, require: true },
});

export default mongoose.model("Survey", surveySchema);
