import User from "../models/user.js";
import fs from "fs";

const replaceSlashes = (myStr) => {
  let res = "";
  for (let i = 0; i < myStr.length; i++) {
    if (myStr[i] !== "\\") {
      res += myStr[i];
      continue;
    }
    res += "/";
  }
  return res;
};

export const updateProfile = async (req, res, next) => {
  const { userId } = req.params;
  const { description } = req.body;

  try {
    const user = await User.findById(userId);

    let profileImg = user.profileImg || "";

    if (req?.file) {
      if (profileImg.length) {
        const path = `uploads\\profile\\${profileImg.split("/").slice(-1)[0]}`;
        fs.unlink(path, (err) => err && console.log(err));
      }

      profileImg = `${req.protocol}://${req.get("host")}/${replaceSlashes(
        req.file.path
      )}`;
    }

    const newUser = await User.findByIdAndUpdate(
      userId,
      {
        description,
        profileImg,
      },
      { new: true }
    );

    res.status(200).json({
      result: newUser,
      message: "Änderungen erfolgreich gespeichert!",
    });
  } catch (error) {
    res.status(500).json({
      message: "Etwas ist schiefgelaufen. Bitte versuche es später erneut.",
    });
  }
};
