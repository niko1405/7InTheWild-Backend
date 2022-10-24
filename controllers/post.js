import { Expo } from "expo-server-sdk";
import { v4 as uuidv4 } from "uuid";

import cloudinary from "../cloud/index.js";
import { sendBatchNotifications } from "../index.js";
import Post from "../models/post.js";
import User from "../models/user.js";

const months = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

function getDate(dateObj = new Date()) {
  return `${dateObj.getDate()}. ${
    months[dateObj.getMonth()]
  } ${dateObj.getFullYear()},${dateObj.getHours()}:${`0${dateObj
    .getMinutes()
    .toString()}`.slice(-2)}`;
}

export const createPost = async (req, res) => {
  const { title, content, meta, slug, author, tags, thumbnail } = req.body;
  const { file } = req;
  const alreadyExists = await Post.findOne({ slug });

  if (alreadyExists)
    return res.status(401).json({ error: "The slug already exists." });

  const newPost = await Post.create({
    title,
    content,
    meta,
    slug,
    author,
    tags,
    createdAt: getDate(),
  });

  try {
    if (file) {
      const { secure_url: url, public_id } = await cloudinary.uploader.upload(
        file.path,
        { upload_preset: "7INTHEWILD" }
      );
      newPost.thumbnail = { url, public_id };
    } else {
      newPost.thumbnail = { url: thumbnail?.url, public_id: "" };
    }

    await newPost.save();

    //handle notifications
    let messages = [];

    const users = await User.find({
      $and: [
        { "settings.notifications.enable": true },
        { "settings.notifications.blog": true },
      ],
    });

    const notificationObj = {
      body: "Soeben wurde ein neuer Post veröffentlicht! Klicke, um zu öffnen",
      title: "Es gibt neues zu Entdecken!",
      data: {
        location: "BlogPostAppDetails",
        extraLocation: { post: newPost },
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

    res.status(200).json({
      post: newPost,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadImage = async (req, res) => {
  const { file } = req;
  if (!file) return res.status(401).jaon({ error: "Image file is missing" });

  try {
    const { secure_url: url, public_id } = await cloudinary.uploader.upload(
      file.path,
      {
        upload_preset: "7INTHEWILD",
      }
    );

    res.status(201).json({ image: { url, public_id } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteImage = async (req, res) => {
  const { public_id } = req.body;

  try {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok")
      return res
        .status(404)
        .json({ error: "Could not delete image from cloud" });

    res.status(201).json({ message: "Deleted Image successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPost = async (req, res) => {
  const { slug } = req.params;

  try {
    const post = await Post.findOne({ slug });
    if (!post) return res.status(404).json({ error: "Post not found" });

    res.status(200).json({ post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPosts = async (req, res) => {
  const { pageNo = 0, limit = 10 } = req.query;

  try {
    const TOTAL = await Post.countDocuments();
    const startIndex = Number(pageNo) * Number(limit);

    const posts = await Post.find({})
      .limit(Number(limit))
      .skip(startIndex)
      .sort({ _id: -1 })
      .lean();

    res.status(200).json({ posts, totalPosts: TOTAL });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPostsByFilter = async (req, res) => {
  const { filter, searchTags } = req.query;

  try {
    let posts = [];

    if (searchTags === "true") {
      posts = await Post.find({
        tags: { $in: filter },
      })
        .sort({ _id: -1 })
        .lean();
    } else {
      posts = await Post.find({
        createdAt: { $regex: filter, $options: "i" },
      })
        .sort({ _id: -1 })
        .lean();
    }

    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getArchive = async (req, res) => {
  try {
    const dates = (
      await Post.find({}, { createdAt: 1 }).sort({ _id: -1 }).lean()
    ).map(({ createdAt }) => createdAt);

    const archive = [];

    dates.map((dateObj) => {
      const date = dateObj.split(",")[0].split(" ");
      const month = `${date[1]} ${date[2]}`;

      if (!archive.includes(month)) archive.push(month);
    });

    res.status(200).json({ archive });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRelatedPosts = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId).lean();
    if (!post)
      return res.status(404).json({ error: "Post with given ID not found" });

    const LIMIT = 5;

    const posts = await Post.find({
      tags: { $in: [...post.tags] },
      _id: { $ne: post._id },
    })
      .limit(LIMIT)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const searchPosts = async (req, res) => {
  const { searchQuery } = req.body;

  try {
    if (!searchQuery?.toString()?.trim())
      return res.status(401).json({ error: "Search query is not valid" });

    const posts = await Post.find({
      $or: [
        { title: { $regex: searchQuery, $options: "i" } },
        {
          tags: {
            $regex: searchQuery?.toString()?.includes("#")
              ? searchQuery?.toString()?.split("#")[1]
              : searchQuery,
            $options: "i",
          },
        },
      ],
    })
      .sort({ _id: -1 })
      .lean();

    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePost = async (req, res) => {
  const { postId } = req.params;
  const { title, content, meta, slug, author, tags, thumbnail } = req.body;
  const { file } = req;
  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const public_id = post.thumbnail?.public_id;

    if (
      public_id.length &&
      (file ||
        (thumbnail?.url?.length && thumbnail?.url !== post.thumbnail.url))
    )
      await cloudinary.uploader.destroy(public_id);

    if (file) {
      const { secure_url: url, public_id } = await cloudinary.uploader.upload(
        file.path,
        { upload_preset: "7INTHEWILD" }
      );
      post.thumbnail = { url, public_id };
    }

    if (
      !file &&
      thumbnail?.url?.length &&
      thumbnail?.url !== post.thumbnail.url
    )
      post.thumbnail = { url: thumbnail?.url, public_id: "" };

    post.title = title;
    post.meta = meta;
    post.content = content;
    post.slug = slug;
    post.tags = tags;
    post.author = author;

    await post.save();

    res.status(200).json({ post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePost = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const public_id = post.thumbnail?.public_id;
    if (public_id) {
      const { result } = await cloudinary.uploader.destroy(public_id);
      if (result !== "ok")
        return res
          .status(404)
          .json({ error: "Could not delete image from cloud" });
    }

    await post.remove();

    res.status(200).json({ message: "Post deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAvailableImages = async (req, res) => {
  try {
    const { resources } = await cloudinary.api.resources({
      type: "upload",
      prefix: "7InTheWild",
    });

    const images = resources.map(({ secure_url: url, public_id }) => ({
      url,
      public_id,
    }));

    res.status(200).json({ images });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
