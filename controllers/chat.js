import { v4 as uuidv4 } from "uuid";
import { Expo } from "expo-server-sdk";

import Chat from "../models/chat.js";
import User from "../models/user.js";

import { sendBatchNotifications } from "../index.js";

export const comment = async (req, res) => {
  const { chatId } = req.params;
  const comment = req.body;

  try {
    const oldChat = await Chat.findById(chatId);

    let chat = null;
    if (!oldChat) {
      chat = await Chat.create({
        messages: [comment],
        _id: "globalChat",
      });

      await chat.save();
    } else {
      const messages = oldChat.messages;
      messages.push(comment);

      if (messages.length > 200) messages.shift();

      chat = await Chat.findByIdAndUpdate(
        chatId,
        {
          messages,
        },
        { new: true }
      );
    }

    res.status(200).json({ chat });

    if (chat && chatId !== "globalChat") {
      //handle notifications
      let messages = [];

      const notificationObj = {
        title: `Direkt-Nachricht von ${comment.userName}`,
        body: `${comment.userName}: ${
          comment.content.length > 70
            ? `${comment.content.substring(0, 70)}..`
            : comment.content
        }`,
        data: {
          location: "MessageAppStack",
          extraLocation: {
            screen: "Message",
            params: { userName: comment.userName, chatId },
          },
        },
        id: uuidv4(),
        chatId,
      };

      for (let id of chat.partIds) {
        if (id !== comment.userId) {
          //not send notification to user commenting
          //get user activated notifications
          const user = await User.findOne({
            _id: id,
            $and: [
              { "settings.notifications.enable": true },
              { "settings.notifications.direct": true },
            ],
          });

          if (user) {
            //check if user has not chat opened otherwise don't send notification
            if (user.currentLocation?.params?.chatId !== chatId) {
              //add notifications
              const userNots = user.notifications;
              user.notifications =
                userNots.length > 25
                  ? [...userNots.slice(1), notificationObj]
                  : [...userNots, notificationObj];
              //add latest Messages
              user.latestMessages = [
                ...user.latestMessages,
                {
                  userName: comment.userName,
                  message: comment.content,
                  chatId,
                },
              ];

              user.save();

              const token = user.pushToken;

              if (token && Expo.isExpoPushToken(token)) {
                messages.push({
                  to: token,
                  sound: "default",
                  body: notificationObj.body,
                  title: notificationObj.title,
                  data: notificationObj.data,
                });
              }
            }
          }
        }
      }

      sendBatchNotifications(messages);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Ein Fehler ist aufgetreten." });
  }
};

export const createChat = async (req, res) => {
  const { comment, globalChat, participants } = req.body;

  try {
    const users = await User.find(
      { _id: { $in: participants } },
      { _id: 1, userName: 1, profileImg: 1 }
    );

    const partIds = users.map((user) => user._id);

    const chat = await Chat.create({
      _id: globalChat ? "globalChat" : uuidv4(),
      messages: [comment],
      participants: users,
      partIds,
    });

    await chat.save();

    res.status(200).json({ chat });
  } catch (error) {
    res.status(500).json({ message: "Ein Fehler ist aufgetreten." });
  }
};

export const searchChat = async (req, res) => {
  const participants = req.body;

  try {
    const chat = await Chat.findOne({
      partIds: {
        $all: participants,
      },
    }).lean();

    res.status(200).json({ chat });
  } catch (error) {
    res.status(500).json({ message: "Ein Fehler ist aufgetreten." });
  }
};

export const getChat = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId).lean();

    res.status(200).json({ chat });
  } catch (error) {
    res.status(500).json({ message: "Ein Fehler ist aufgetreten." });
  }
};

export const getChats = async (req, res) => {
  const { userId } = req.params;

  try {
    const chats = await Chat.find({
      partIds: { $in: userId },
    })
      .sort({ _id: -1 })
      .lean();

    res.status(200).json({ chats });
  } catch (error) {
    res.status(500).json({ message: "Ein Fehler ist aufgetreten." });
  }
};

export const chatAction = async (req, res) => {
  const { chatId, userId } = req.query;
  const { subject } = req.body;

  try {
    let newChat = null;

    if (subject === "delete") await Chat.findByIdAndRemove(chatId);
    else
      newChat = await Chat.findByIdAndUpdate(
        chatId,
        { messages: [] },
        { new: true }
      );

    res.status(200).json({ newChat });
  } catch (error) {
    res.status(500).json({ message: "Ein Fehler ist aufgetreten." });
  }
};

export const removeLatestMessages = async (req, res) => {
  const { chatId, userId } = req.query;

  try {
    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({ message: "Ein Fehler ist aufgetreten." });

    const latestMessages = user.latestMessages.filter(
      (msg) => msg.chatId !== chatId
    );

    const notifications = user.notifications.filter(
      (not) => not.chatId !== chatId
    );

    user.latestMessages = latestMessages;
    user.notifications = notifications;

    await user.save();

    res.status(200).json({ result: user });
  } catch (error) {
    res.status(500).json({ message: "Ein Fehler ist aufgetreten." });
  }
};
