import { Expo } from "expo-server-sdk";
import { v4 as uuidv4 } from "uuid";

import DailySurvey from "../models/dailySurvey.js";
import User from "../models/user.js";

import { sendBatchNotifications } from "../index.js";

export const createSurvey = async (req, res) => {
  const survey = req.body;

  try {
    const newSurvey = await DailySurvey.create({
      createdAt: new Date().toISOString(),
      question: survey.question,
      options: survey.options,
      title: "TÄgliche Umfrage",
    });

    await newSurvey.save();

    //handle notifications
    let messages = [];

    const users = await User.find({
      $and: [
        { "settings.notifications.enable": true },
        { "settings.notifications.dailySurvey": true },
      ],
    });

    const notificationObj = {
      body: "Eine neue tägliche Umfrage ist da! Klicke, um zu öffnen",
      title: "Tägliche Umfrage",
      data: {
        location: "VotingStack",
        extraLocation: { screen: "Voting", params: { tabIndex: 1 } },
      },
      id: uuidv4(),
    };

    for (let matchUser of users) {
      //add notification
      const userNots = matchUser.notifications;
      matchUser.notifications =
        userNots.length > 25
          ? [...userNots.slice(1), notificationObj]
          : [...userNots, notificationObj];
      matchUser.save();

      const token = matchUser.pushToken;
      if (!token) continue;

      if (!Expo.isExpoPushToken(token)) continue;

      messages.push({
        to: token,
        sound: "default",
        body: notificationObj.body,
        title: notificationObj.title,
        data: notificationObj.data,
      });
    }

    sendBatchNotifications(messages);

    res
      .status(200)
      .json({ survey: newSurvey, message: "Umfrage erfolgreich erstellt!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const getSurvey = async (req, res) => {
  const { surveyId } = req.params;

  try {
    const survey = await DailySurvey.findById(surveyId).lean();

    if (!survey) return res.status(404).json({ error: "Survey not found" });

    res.status(200).json({ survey });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const getSurveys = async (req, res) => {
  try {
    const surveys = await DailySurvey.find({}).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      surveys,
    });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const getSurveysSection = async (req, res) => {
  const { section } = req.params;

  try {
    const LIMIT = 10;
    const TOTAL = await DailySurvey.countDocuments();
    const startIndex = Number(section) * LIMIT;

    const surveys = await DailySurvey.find({})
      .limit(LIMIT)
      .skip(startIndex)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      surveys,
      total: TOTAL,
    });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const updateSurvey = async (req, res) => {
  const { surveyId } = req.params;
  const newSurvey = req.body;

  try {
    const updatedSurvey = await DailySurvey.findByIdAndUpdate(
      surveyId,
      {
        question: newSurvey.question,
        options: newSurvey.options,
      },
      { new: true }
    ).lean();

    res.status(200).json({
      survey: updatedSurvey,
      message: "Umfrage erfolgreich aktualisiert!",
    });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const voteSurvey = async (req, res) => {
  const { surveyId } = req.params;
  const { userId, option } = req.body;

  try {
    const survey = await DailySurvey.findById(surveyId).lean();
    const user = await User.findById(userId).lean();

    if (!survey || !user)
      return res.status(404).json({
        message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
      });

    let newOptions = survey.options;

    newOptions.forEach((surveyOption) => {
      surveyOption.name === option && surveyOption?.clicked?.push(userId);
    });

    const updatedSurvey = await DailySurvey.findByIdAndUpdate(
      surveyId,
      {
        options: newOptions,
      },
      { new: true }
    ).lean();

    const updatedProfile = await User.findByIdAndUpdate(
      userId,
      { answeredSurveys: user.answeredSurveys + 1 || 1 },
      { new: true }
    ).lean();

    res.status(200).json({ survey: updatedSurvey, profile: updatedProfile });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const deleteSurvey = async (req, res) => {
  const { surveyId } = req.params;

  try {
    const survey = await DailySurvey.findById(surveyId);

    await survey.remove();

    res.status(200).json({ message: "Umfrage erfolgreich gelöscht!" });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const searchSurvey = async (req, res) => {
  const { searchQuery } = req.body;

  try {
    if (!searchQuery?.toString()?.trim())
      return res.status(401).json({ error: "Search query is not valid" });

    const surveys = await DailySurvey.find({
      question: { $regex: searchQuery, $options: "i" },
    })
      .sort({ _id: -1 })
      .lean();

    res.status(200).json({ surveys });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
