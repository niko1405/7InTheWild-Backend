import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import { Server } from "socket.io";
import { Expo } from "expo-server-sdk";

import userRoutes from "./routes/user.js";
import profileRoutes from "./routes/profile.js";
import chatRoutes from "./routes/chat.js";
import settingsRoutes from "./routes/settings.js";
import surveyRoutes from "./routes/survey.js";
import newsRoutes from "./routes/news.js";
import postRoutes from "./routes/post.js";
import dailySurveyRoutes from "./routes/dailySurvey.js";

let expo = new Expo();

const app = express();
dotenv.config();

app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

app.use("/user", userRoutes);
app.use("/profile", profileRoutes);
app.use("/chat", chatRoutes);
app.use("/settings", settingsRoutes);
app.use("/survey", surveyRoutes);
app.use("/news", newsRoutes);
app.use("/post", postRoutes);
app.use("/daily-survey", dailySurveyRoutes);

app.get("/", (req, res) => res.send("Welcome to 7InTheWild API"));

const PORT = process.env.PORT || 5000;

mongoose.connect(
  process.env.CONNECTION_URL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err) => {
    if (err) return console.log(err.message);
    const server = app.listen(PORT, () => {
      console.log(`Server running on Port ${PORT}!`);
    });

    const io = new Server(server, {
      cors: {
        origin: "https://auth.expo.io/@niko0514/7InTheWild",
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      socket.on("join-chat", (chatId) => {
        socket.join(chatId);
      });

      socket.on("send-msg-to-group", (data) => {
        socket.to(data.chatId).emit("msg-receive", data.comment);
      });
    });
  }
);

export function sendBatchNotifications(messages) {
  let chunks = expo.chunkPushNotifications(messages);

  let tickets = [];
  (async () => {
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);

        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }
  })();
}
