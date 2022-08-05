import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";

const app = express();
dotenv.config();

app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);

app.use("/uploads", express.static("./uploads"));

app.get("/", (req, res) => res.send("Welcome to 7InTheWild API"));

const PORT = process.env.PORT || 5000;

mongoose.connect(
  process.env.CONNECTION_URL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err) => {
    if (err) return console.log(err.message);
    app.listen(PORT, () => {
      console.log(`Server running on Port ${PORT}`);
    });
  }
);
