import bcrypt from "bcryptjs";

import User from "../models/user.js";

export const signup = async (req, res) => {
  const { email, userName, password } = req.body;

  const makeId = () => {
    let ID = "";
    let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (var i = 0; i < 12; i++) {
      ID += characters.charAt(Math.floor(Math.random() * 36));
    }
    return ID;
  };

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
      profileImg: "",
      // publicImageId: '',
      description: "",
      // posts: [],
      // follower: [],
      // follows: [],
      _id: makeId(),
    }).catch((error) => console.log(error));

    res.status(200).json({
      result: user,
      message: "Erfolgreich registriert!",
    });
  } catch (error) {
    res.status(500).json({
      message: "Etwas ist schiefgelaufen. Bitte versuche es später erneut.",
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
      message: "Etwas ist schiefgelaufen. Bitte versuche es später erneut.",
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
        profileImg: picture,
        // publicImageId: '',
        description: "",
        // posts: [],
        // follower: [],
        // follows: [],
        // chats: [],
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
      message: "Etwas ist schiefgelaufen. Bitte versuche es später erneut.",
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
      message: "Etwas ist schiefgelaufen. Bitte versuche es später erneut.",
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
      message: "Etwas ist schiefgelaufen. Bitte versuche es später erneut.",
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
      message: "Etwas ist schiefgelaufen. Bitte versuche es später erneut.",
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
        message: "Etwas ist schiefgelaufen. Bitte versuche es später erneut.",
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
      message: "Änderungen erfolgreich gespeichert!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Etwas ist schiefgelaufen. Bitte versuche es später erneut.",
    });
  }
};

export const deleteAccount = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    // const userPosts = await PostMessage.find({ creator: id });

    //delete all post image data from user
    // userPosts.length && userPosts.forEach(async userPost => {
    //     const public_id = userPost.publicFileId;

    //     if (public_id && public_id?.length) {
    //         cloudinary.uploader.destroy(public_id);
    //         await userPost.remove();
    //     }
    // });

    //delete user profile image
    // if (user.publicImageId && user.publicImageId?.length) {
    //     cloudinary.uploader.destroy(user.publicImageId);
    // }

    //delete user from other user's follower/following lists
    // const affectedUsers = await User.find({ $or: [{ follower: { $in: user._id } }, { follows: { $in: user._id } }] });

    // affectedUsers.length && affectedUsers.forEach(async affUser => {
    //     await affUser.updateOne({
    //         follower: affUser.follower.filter(followerId => followerId !== user._id),
    //         follows: affUser.follows.filter(followsId => followsId !== user._id)
    //     });
    // });

    //remove user
    await user.remove();

    res.json({
      message: "Account erfolgreich gelöscht!",
    });
  } catch (error) {
    res.status(422).json({
      message: "Etwas ist schiefgelaufen. Bitte versuche es später erneut.",
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
      message: "Etwas ist schiefgelaufen. Bitte versuche es später erneut.",
    });
  }
};
