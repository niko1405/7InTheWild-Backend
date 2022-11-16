import User from "../models/user.js";
import Favorit from "../models/favorit.js";
import cloudinary from "../cloud/index.js";

export const updateProfile = async (req, res) => {
  const { userId } = req.params;
  const { description, imageUrl } = req.body;
  const file = req.file;
  console.log(file);
  try {
    const user = await User.findById(userId).lean();

    let profileImg = user.profileImg;

    let public_id = user.profileImg?.public_id;

    if ((file || imageUrl) && public_id?.length) {
      await cloudinary.uploader.destroy(public_id);
    }

    if (file) {
      const { secure_url: uri, public_id } = await cloudinary.uploader.upload(
        file.path,
        { upload_preset: "7INTHEWILD" }
      );
      profileImg = { uri, public_id };
    }

    if (imageUrl) profileImg = { uri: imageUrl, public_id: "" };

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
    console.log(error);
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const getProfile = async (req, res) => {
  const { userId, userName } = req.query;

  try {
    const profile = await User.findOne({
      $or: [{ _id: userId }, { userName }],
    });

    if (!profile)
      res.status(404).json({
        message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
      });

    res.status(200).json({ profile });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const setFavorit = async (req, res) => {
  const { userId } = req.params;
  const { name } = req.body;

  try {
    const user = await User.findById(userId);

    const updatedProfile = await User.findByIdAndUpdate(
      userId,
      { favorit: name },
      { new: true }
    );

    let favorits = await Favorit.findOne().lean();

    if (!favorits || favorits?.votes?.length !== 7) {
      favorits = await Favorit.create({
        votes: [
          {
            name: "Fritz",
            votes: [],
          },
          {
            name: "Knossi",
            votes: [],
          },
          {
            name: "Sascha",
            votes: [],
          },
          {
            name: "Sabrina",
            votes: [],
          },
          {
            name: "Nova",
            votes: [],
          },
          {
            name: "Otto",
            votes: [],
          },
          {
            name: "Joris",
            votes: [],
          },
        ],
        createdAt: new Date().toISOString(),
      });
    }

    const hasFavorit = user?.favorit;

    const dateObj = new Date();

    const date = `${dateObj.getFullYear().toString().slice(-2)}-${(
      "0" +
      (dateObj.getMonth() + 1)
    ).slice(-2)}-${("0" + dateObj.getDate()).slice(-2)}`;

    const votes = !hasFavorit?.length
      ? favorits.votes
      : favorits.votes
          .map(
            (
              fav //remove last vote (no matter which element) from votes if user has already voted for another favorit
            ) =>
              fav.name === hasFavorit
                ? {
                    ...fav,
                    votes: fav.votes?.length
                      ? fav.votes.filter((x, i) => i !== fav.votes.length - 1)
                      : [],
                  }
                : fav
          )
          .map(
            (
              fav //add new vote
            ) =>
              fav.name === name ? { ...fav, votes: [...fav.votes, date] } : fav
          );

    const updatedFavorits = await Favorit.findOneAndUpdate(
      undefined,
      {
        votes,
        createdAt:
          favorits.votes.length > 0
            ? favorits.createdAt
            : new Date().toISOString(),
      },
      { new: true }
    ).lean();

    res.status(200).json({
      profile: updatedProfile,
      favorits:
        {
          votes: updatedFavorits?.votes,
          createdAt: updatedFavorits?.createdAt,
        } || {},
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const getFavorits = async (req, res) => {
  try {
    const favorits = await Favorit.findOne().lean();

    res.status(200).json({
      favorits:
        {
          votes: favorits?.votes,
          createdAt: favorits?.createdAt,
        } || {},
    });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};

export const searchProfiles = async (req, res) => {
  const { searchQuery } = req.body;

  try {
    const profiles = await User.find(
      {
        userName: { $regex: searchQuery, $options: "i" },
      },
      { _id: 1, userName: 1, profileImg: 1 }
    ).lean();

    res.status(200).json({
      profiles,
    });
  } catch (error) {
    res.status(500).json({
      message: "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.",
    });
  }
};
