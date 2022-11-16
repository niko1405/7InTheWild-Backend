import User from "../models/user.js";

export const changeLiveChatSettings = async (req, res) => {
  const { userId } = req.params;
  const { theme, fontStyle } = req.body;

  try {
    const user = await User.findById(userId);

    const newUser = await User.findByIdAndUpdate(
      userId,
      {
        settings: {
          ...user.settings,
          chatSettings: { theme, fontStyle },
        },
      },
      { new: true }
    );

    res.status(200).json({ chatSettings: newUser.settings.chatSettings });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message:
        "Änderungen konnten nicht gespeichert werden. Versuche es später erneut.",
    });
  }
};

export const getLiveChatSettings = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({
        message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
      });

    res.status(200).json({
      liveChat: user.settings?.chatSettings || {
        theme: "Custom",
        fontStyle: "Cracked",
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const setNotifications = async (req, res) => {
  const { userId } = req.params;
  const notifications = req.body;

  try {
    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({
        message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
      });

    user.settings = { ...user.settings, notifications };

    if (!notifications.enable) {
      user.notifications = [];
      user.latestMessages = [];
    }

    await user.save();

    res.status(200).json({
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const getNotifications = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({
        message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
      });

    res.status(200).json({
      notifications: user.settings?.notifications,
    });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const changeTheme = async (req, res) => {
  const { userId } = req.params;
  const { darkMode } = req.body;

  try {
    const user = await User.findById(userId);

    user.settings = { ...user.settings, darkMode };

    await user.save();

    res.status(200).json({
      darkMode,
    });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};
