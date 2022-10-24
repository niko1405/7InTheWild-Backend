import mongoose from "mongoose";

const surveySchema = mongoose.Schema({
  createdAt: { type: String, require: true },
  title: { type: String, require: true },
  question: { type: String, require: true },
  options: { type: Array, require: true },
});

export default mongoose.model("DailySurvey", surveySchema);
