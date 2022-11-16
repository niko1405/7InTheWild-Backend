import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

import cloudinary from "../cloud/index.js";
import User from "../models/user.js";

export const signup = async (req, res) => {
  const { email, userName, password } = req.body;

  try {
    if (await User.findOne({ email })) {
      return res
        .status(400)
        .json({ message: "Diese Email ist bereits registriert." });
    }

    if (await User.findOne({ userName })) {
      return res
        .status(400)
        .json({ message: "Dieser Benutzername ist bereits in Verwendung." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      userName,
      password: hashedPassword,
      _id: uuidv4(),
    }).catch((error) => console.log(error));

    res.status(200).json({
      result: user,
      message: "Erfolgreich registriert!",
    });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const login = async (req, res) => {
  const { email, userName, password } = req.body;

  try {
    const filter = email.length > 0 ? email : userName;

    const user = await User.findOne({
      $or: [{ userName: filter }, { email: filter }],
    });

    if (!user) {
      return res.status(404).json({
        target: "password",
        message: `${
          email.length > 0
            ? "Die angegebene Email"
            : "Der angegebene Benutzername"
        } oder Passwort ist ungültig.`,
      });
    }

    if (!user.password) {
      return res.status(404).json({
        target: "password",
        message: `Die angegebene Email kann nur über Google angemeldet oder ein neues Passwort über "Passwort vergessen" erstellt werden.`,
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ target: "password", message: "Ungültiges Passwort." });
    }

    res.status(200).json({ message: "Erfolgreich eingeloggt!", result: user });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const googleSignIn = async (req, res) => {
  const { email, given_name, sub, picture } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      const newUser = await User.create({
        email,
        userName: given_name,
        profileImg: { uri: picture, public_id: "" },
        _id: sub,
      }).catch((error) => console.log(error));

      res.status(200).json({
        result: newUser,
        message: "Erfolgreich angemeldet!",
      });
    } else
      res.status(200).json({
        result: existingUser,
        message: "Erfolgreich angemeldet!",
      });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const getUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(400)
        .json({ message: "Nutzer mit angegebener Id nicht gefunden." });
    }

    res.status(200).json({
      result: user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const existUser = async (req, res) => {
  const { email, userName, userId } = req.body;

  try {
    const filter = email || userName || userId;

    const user = await User.findOne({
      $or: [{ userName: filter }, { email: filter }, { _id: filter }],
    });

    if (!user) {
      return res.status(400).json({
        message: "Die angegebene Email/Benutzername wurde nicht gefunden.",
      });
    }

    res.status(200).json({ result: user });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const changePassword = async (req, res) => {
  const { userId, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );

    res.json({ message: "Passwort erfolgreich geändert." });
  } catch (error) {
    res.status(422).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const updateUser = async (req, res) => {
  const { userId } = req.params;
  const { email, activePassword, newPassword, userName } = req.body;

  let newHashedPassword = "";

  try {
    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({
        message:
          "Änderungen konnten nicht gespeichert werden. Versuche es später erneut.",
      });

    if (newPassword.length) {
      const isPasswordCorrect = await bcrypt.compare(
        activePassword,
        user.password
      );

      if (!isPasswordCorrect)
        return res.status(400).json({
          message: "Das aktuelle Passwort ist ungültig.",
        });

      newHashedPassword = await bcrypt.hash(newPassword, 12);
    }

    if (email.length && user.email !== email) {
      if ((await User.findOne({ email })) !== null)
        return res.status(400).json({
          message: "Die angegebene E-Mail Addresse ist bereits in Verwendung.",
        });
    }

    if (userName.length && user.userName !== userName) {
      if ((await User.findOne({ userName })) !== null)
        return res.status(400).json({
          message: "Der angegebene Benutzername ist bereits in Verwendung.",
        });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        userName: userName || user.userName,
        email: email || user.email,
        password: newHashedPassword || user.password,
      },
      { new: true }
    );

    res.status(200).json({
      result: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message:
        "Änderungen konnten nicht gespeichert werden. Versuche es später erneut.",
    });
  }
};

export const deleteAccount = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    const public_id = user?.profileImg?.public_id;

    if (public_id) await cloudinary.uploader.destroy(public_id);

    await user.remove();

    res.json({
      message: "Account erfolgreich gelöscht!",
    });
  } catch (error) {
    res.status(422).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const changeUsername = async (req, res) => {
  const { id } = req.params;
  const { userName } = req.body;

  try {
    const existingUser = await User.findOne({ userName });

    if (existingUser)
      return res.status(400).json({
        message:
          "Dieser Benutzername ist bereits in Verwendung. Bitte versuche einen anderen.",
      });

    await User.findByIdAndUpdate(id, { userName }, { new: true });

    res.json({ message: `Du hast dein Benutzername erfolgreich geändert.` });
  } catch (error) {
    res.status(422).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const setPushToken = async (req, res) => {
  const { userId } = req.params;
  const { token } = req.body;

  try {
    await User.findByIdAndUpdate(userId, { pushToken: token });

    res.status(200).json({ token });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten.",
    });
  }
};

export const getPushToken = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId, { pushToken: 1 }).lean();

    res.status(200).json({ token: user.pushToken });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten.",
    });
  }
};

export const changeLocation = async (req, res) => {
  const { userId } = req.params;
  const { location } = req.body;

  try {
    await User.findByIdAndUpdate(userId, { currentLocation: location });

    res.status(200).json({ location });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten.",
    });
  }
};

export const changeNotifications = async (req, res) => {
  const { userId } = req.params;
  const { notifications } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { notifications },
      { new: true }
    );

    res.status(200).json({ result: user });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten.",
    });
  }
};

export const getPremium = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { premium: true },
      { new: true }
    );

    res.status(200).json({ result: user });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten.",
    });
  }
};
