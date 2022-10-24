import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  email: { type: String, require: true },
  userName: { type: String, require: true },
  password: { type: String, require: true },
  description: { type: String, require: true },
  answeredSurveys: { type: Number, require: true },
  favorit: { type: String, require: true },
  profileImg: { type: Object, require: true },
  settings: { type: Object, require: true },
  pushToken: { type: String, require: true },
  notifications: { type: Array, require: true },
  latestMessages: { type: Array, require: true },
  currentLocation: { type: Object, require: true },
  _id: { type: String },
});

export default mongoose.model("User", userSchema);
