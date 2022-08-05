import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  email: { type: String, require: true },
  userName: { type: String, require: true },
  password: { type: String, require: true },
  description: { type: String, require: true },
  // follower: { type: Array, require: true },
  // follows: { type: Array, require: true },
  // savedPosts: { type: Array, require: true },
  profileImg: { type: String, require: true },
  // publicImageId: { type: String, require: true },
  // chats: { type: Array, require: true },
  _id: { type: String },
});

export default mongoose.model("User", userSchema);
