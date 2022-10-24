import mongoose from "mongoose";

const chatSchema = mongoose.Schema({
  messages: { type: Array, require: true },
  _id: { type: String },
  participants: { type: Array, require: true },
  partIds: { type: Array, require: true },
});

export default mongoose.model("Chat", chatSchema);
