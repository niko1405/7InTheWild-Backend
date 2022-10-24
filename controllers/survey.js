import { Expo } from "expo-server-sdk";
import { v4 as uuidv4 } from "uuid";

import Survey from "../models/survey.js";
import User from "../models/user.js";

import { sendBatchNotifications } from "../index.js";

export const createSurvey = async (req, res) => {
  const { userId } = req.params;
  const survey = req.body;

  try {
    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({
        message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
      });

    const newSurvey = await Survey.create({
      createdAt: new Date().toISOString(),
      userId: userId,
      userName: user?.userName,
      question: survey.question,
      options: survey.options,
      message: survey.message,
      uri: survey.uri,
      comments: [],
    });

    await newSurvey.save();

    res
      .status(200)
      .json({ survey: newSurvey, message: "Umfrage erfolgreich erstellt!" });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const getSurveys = async (req, res) => {
  const { userId, section, filter } = req.query;

  try {
    const TOTAL = await Survey.countDocuments();
    const LIMIT = 2;
    let surveys = [];

    if (userId) surveys = await Survey.find({ userId }, { comments: 0 }).lean();

    if (userId === "null") {
      const startIndex = (Number(section) - 1) * LIMIT;

      if (filter === "Neueste") {
        surveys = await Survey.find({}, { comments: 0 })
          .sort({ createdAt: -1 })
          .limit(LIMIT)
          .skip(startIndex)
          .lean();
      } else {
        surveys = await Survey.aggregate([
          {
            $addFields: {
              likesLength: {
                $size: "$likes",
              },
            },
          },
          {
            $sort: { likesLength: -1 },
          },
          { $skip: startIndex },
        ])
          .limit(LIMIT)
          .project({ comments: 0 });
      }
    }

    res.status(200).json({
      surveys,
      total: userId !== "null" ? -1 : TOTAL,
    });
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
    const survey = await Survey.findById(surveyId, { comments: 0 }).lean();

    if (!survey)
      return res.status(404).json({
        message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
      });

    res.status(200).json({ survey });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const getComments = async (req, res) => {
  const { surveyId } = req.params;

  try {
    const { comments } = await Survey.findById(surveyId, {
      comments: 1,
    }).lean();

    if (!comments)
      return res.status(404).json({
        message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
      });

    res.status(200).json({ comments });
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
    const updatedSurvey = await Survey.findByIdAndUpdate(
      surveyId,
      {
        question: newSurvey.question,
        options: newSurvey.options,
        message: newSurvey.message,
        uri: newSurvey.uri,
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

export const likeSurvey = async (req, res) => {
  const { surveyId } = req.params;
  const { userId } = req.body;

  try {
    const survey = await Survey.findById(surveyId).lean();

    if (!survey)
      return res.status(404).json({
        message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
      });

    const updatedSurvey = await Survey.findByIdAndUpdate(
      surveyId,
      {
        likes: survey.likes.includes(userId)
          ? survey.likes.filter((id) => id !== userId)
          : [...survey.likes, userId],
      },
      { new: true }
    ).lean();

    res.status(200).json({ survey: updatedSurvey });
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
    const survey = await Survey.findById(surveyId).lean();
    const user = await User.findById(userId).lean();

    if (!survey || !user)
      return res.status(404).json({
        message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
      });

    let newOptions = survey.options;

    newOptions.forEach((surveyOption) => {
      surveyOption.name === option && surveyOption?.clicked?.push(userId);
    });

    const updatedSurvey = await Survey.findByIdAndUpdate(
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
    );

    res.status(200).json({ survey: updatedSurvey, profile: updatedProfile });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const commentSurvey = async (req, res) => {
  const { surveyId } = req.params;
  const { comment, newComment, answerComment } = req.body;

  try {
    const survey = await Survey.findById(surveyId).lean();

    if (!survey)
      return res.status(404).json({
        message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
      });

    let update = {};

    if (newComment)
      update = {
        comments: [...survey.comments, comment],
      };
    else {
      const comments = [...survey.comments];
      if (!comments.length) return;

      const updatedComments = comments?.map((commEl) =>
        commEl.messageId === comment.messageId ? comment : commEl
      );

      update = { comments: updatedComments };
    }

    const updatedSurvey = await Survey.findByIdAndUpdate(surveyId, update, {
      new: true,
    }).lean();

    res.status(200).json({ survey: updatedSurvey });

    //handle notifications
    if (!newComment && answerComment !== "null") {
      let messages = [];
      let userQuery = comment.userId; //userId

      if (answerComment.content.includes("@"))
        userQuery = answerComment.content.split("@")[1].split(" ")[0]; //userName

      const user = await User.findOne({
        $or: [{ _id: userQuery }, { userName: userQuery }],
        $and: [
          { "settings.notifications.enable": true },
          { "settings.notifications.comments": true },
        ],
      });

      if (user) {
        if (answerComment.userId === comment.userId) return;

        const notificationObj = {
          body: `${answerComment.userName}: ${
            answerComment.content.length > 90
              ? `${answerComment.content.substring(0, 90)}..`
              : answerComment.content
          }`,
          title: "Jemand hat auf deinen Kommentar reagiert!",
          data: {
            location: "CommentsNotStack",
            extraLocation: {
              screen: "Comments",
              params: {
                focus: false,
                comments: updatedSurvey.comments,
                survey: updatedSurvey,
              },
            },
          },
          id: uuidv4(),
        };

        //add notification
        const userNots = user.notifications;
        user.notifications =
          userNots.length > 25
            ? [...userNots.slice(1), notificationObj]
            : [...userNots, notificationObj];
        user.save();

        const token = user.pushToken;
        if (!token) return;

        if (!Expo.isExpoPushToken(token)) return;

        messages.push({
          to: token,
          sound: "default",
          body: notificationObj.body,
          title: notificationObj.title,
          data: notificationObj.data,
        });

        sendBatchNotifications(messages);
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const likeCommentSurvey = async (req, res) => {
  const { surveyId } = req.params;
  const { messageId, answerId, userId, likedUserId } = req.body;

  try {
    const survey = await Survey.findById(surveyId).lean();

    if (!survey)
      return res.status(404).json({
        message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
      });

    let update = {};
    let likedIndex = -1;

    if (!answerId.length) {
      const updatedComments = survey.comments.map((comment) => {
        if (comment.messageId === messageId) {
          likedIndex = comment.likes.findIndex((id) => id === userId);

          const likes = [...comment.likes];

          if (likedIndex !== -1) likes.splice(likedIndex, 1);
          else likes.push(userId);

          return { ...comment, likes };
        }
        return comment;
      });

      update = { comments: updatedComments };
    } else {
      const updatedComments = survey.comments.map((comment) => {
        if (comment.messageId === messageId) {
          const updatedAnswers = comment.answers.map((answer) => {
            if (answer.messageId === answerId) {
              likedIndex = answer.likes.findIndex((id) => id === userId);

              const likes = [...answer.likes];

              if (likedIndex !== -1) likes.splice(likedIndex, 1);
              else likes.push(userId);

              return { ...answer, likes };
            }

            return answer;
          });

          return { ...comment, answers: updatedAnswers };
        }

        return comment;
      });

      update = { comments: updatedComments };
    }

    const updatedSurvey = await Survey.findByIdAndUpdate(surveyId, update, {
      new: true,
    }).lean();

    res.status(200).json({ survey: updatedSurvey });

    //handle notifications
    if (userId !== likedUserId && likedIndex === -1) {
      const user = await User.findById(userId).lean();

      const likedUser = await User.findOne({
        _id: likedUserId,
        $and: [
          { "settings.notifications.enable": true },
          { "settings.notifications.comments": true },
        ],
      });

      if (likedUser && user) {
        const notificationObj = {
          body: `${user.userName} hat deinen Kommentar geliked`,
          title: "Jemand hat deinen Kommentar geliked!",
          data: {
            location: "CommentsNotStack",
            extraLocation: {
              screen: "Comments",
              params: {
                focus: false,
                comments: updatedSurvey.comments,
                survey: updatedSurvey,
              },
            },
          },
          id: uuidv4(),
        };

        //add notification
        const userNots = likedUser.notifications;
        likedUser.notifications =
          userNots.length > 25
            ? [...userNots.slice(1), notificationObj]
            : [...userNots, notificationObj];

        likedUser.save();
      }
    }
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const deleteCommentSurvey = async (req, res) => {
  const { surveyId } = req.params;
  const { messageId, answerId } = req.body;

  try {
    const survey = await Survey.findById(surveyId).lean();

    if (!survey)
      return res.status(404).json({
        message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
      });

    let update = {};

    if (!answerId.length) {
      const comments = [...survey.comments];

      comments.map(
        (comment, i) => comment.messageId === messageId && comments.splice(i, 1)
      );

      update = { comments };
    } else {
      const updatedComments = survey.comments.map((comment) => {
        if (comment.messageId === messageId) {
          const answers = [...comment.answers];

          answers.map(
            (answer, i) => answer.messageId === answerId && answers.splice(i, 1)
          );

          return { ...comment, answers };
        }

        return comment;
      });

      update = { comments: updatedComments };
    }

    const updatedSurvey = await Survey.findByIdAndUpdate(surveyId, update, {
      new: true,
    }).lean();

    res.status(200).json({ survey: updatedSurvey });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const deleteSurvey = async (req, res) => {
  const { surveyId } = req.params;

  try {
    const survey = await Survey.findById(surveyId);

    await survey.remove();

    res.status(200).json({ message: "Umfrage erfolgreich gelöscht!" });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};
