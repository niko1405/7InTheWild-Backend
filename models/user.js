import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  email: { type: String, require: true, default: "" },
  userName: { type: String, require: true, default: "" },
  password: { type: String, require: true, default: "" },
  description: { type: String, require: true, default: "" },
  answeredSurveys: { type: Number, require: true, default: 0 },
  favorit: { type: String, require: true, default: "" },
  profileImg: {
    type: Object,
    require: true,
    uri: { type: String, require: true, default: "" },
    public_id: { type: String, require: true, default: "" },
  },
  settings: {
    type: Object,
    require: true,
    chatSettings: {
      type: Object,
      require: true,
      fontStyle: { type: String, require: true, default: "Cracked" },
      theme: { type: String, require: true, default: "Standard" },
    },
    notifications: {
      type: Object,
      require: true,
      direct: { type: Boolean, require: true, default: true },
      comments: { type: Boolean, require: true, default: true },
      blog: { type: Boolean, require: true, default: true },
      dailySurvey: { type: Boolean, require: true, default: true },
      enable: { type: Boolean, require: true, default: true },
    },
    darkMode: { type: Boolean, require: true, default: false },
  },
  pushToken: { type: String, require: true, default: "" },
  notifications: { type: Array, require: true },
  latestMessages: { type: Array, require: true },
  currentLocation: {
    type: Object,
    require: true,
    name: { type: String, require: true, default: "" },
    params: { type: Object, require: true },
  },
  premium: { type: Boolean, require: true, default: false },
  _id: { type: String },
});

export default mongoose.model("User", userSchema);
