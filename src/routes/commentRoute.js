const router = require("express").Router();
const authController = require("../controllers/authController");
const commentController = require("../controllers/commentController");
const { check } = require('express-validator');

router.post(
  "/",
  authController.verify,
  [
    check('articleId', 'Article ID is required').notEmpty().isMongoId(),
    check('comment', 'Comment is required').notEmpty()
  ],
  commentController.addComment
);

router.get("/:articleId", commentController.getbyPostId);

module.exports = router;
