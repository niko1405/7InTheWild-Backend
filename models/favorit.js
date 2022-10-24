import mongoose from "mongoose";

const favoritSchema = mongoose.Schema({
  votes: { type: Array, require: true },
  createdAt: { type: String, require: true },
});

export default mongoose.model("Favorit", favoritSchema);
