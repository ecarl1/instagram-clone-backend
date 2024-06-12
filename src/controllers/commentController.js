const Comment = require("../Models/commentModel");
const Article = require("../Models/articleModel");
const { check, validationResult } = require('express-validator');

const addComment = async (req, res) => {
  // Input validation
  await check('articleId', 'Article ID is required').notEmpty().isMongoId().run(req);
  await check('comment', 'Comment is required').notEmpty().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { articleId, comment: commentText } = req.body;
    const sanitizedArticleId = articleId.trim();
    const sanitizedComment = commentText.trim();
    
    const comment = {
      user: req.user._id,
      comment: sanitizedComment
    };

    const commentToSave = new Comment(comment);
    const savedComment = await commentToSave.save();

    await Article.findOneAndUpdate(
      { _id: sanitizedArticleId },
      { $push: { comment: savedComment._id } }
    );

    res.status(200).send({
      status: "success",
      message: "Comment has been created",
    });
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: e.message,
    });
  }
};

const getbyPostId = async (req, res) => {
  const articleId = req.params.articleId;
  try {
    const article = await Article.findOne({ _id: articleId }).populate("comment");
    res.status(200).send({
      status: "success",
      comments: article.comment,
    });
  } catch (error) {
    res.status(500).send({
      status: "failure",
      message: error.message,
    });
  }
};

module.exports = { addComment, getbyPostId };
