const mongoose = require("mongoose");
const supertest = require("supertest");
const express = require("express");
const { addComment, getbyPostId } = require("../src/controllers/commentController");
const Comment = require("../src/Models/commentModel");
const Article = require("../src/Models/articleModel");
const { check, validationResult } = require('express-validator');

const app = express();
app.use(express.json());

app.post("/comments", 
  [
    check('articleId', 'Article ID is required').notEmpty().isMongoId(),
    check('comment', 'Comment is required').notEmpty()
  ], 
  (req, res, next) => {
    req.user = { _id: "1234567890" }; // Mocking req.user for addComment
    next();
  }, 
  addComment
);

app.get("/comments/:articleId", getbyPostId);

jest.mock("../src/Models/commentModel");
jest.mock("../src/Models/articleModel");

describe("Comment Controller", () => {
  beforeEach(() => {
    Comment.mockClear();
    Article.mockClear();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test("should add a comment successfully", async () => {
    const reqBody = {
      articleId: "60c72b2f9b1d4c3c4c8e1f30",
      comment: "This is a test comment",
    };

    const savedComment = new Comment({ ...reqBody, user: "1234567890" });
    Comment.prototype.save = jest.fn().mockResolvedValue(savedComment);
    Article.findOneAndUpdate = jest.fn().mockResolvedValue({});

    const response = await supertest(app)
      .post("/comments")
      .send(reqBody);

    expect(Comment.prototype.save).toHaveBeenCalled();
    expect(Article.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: reqBody.articleId },
      { $push: { comment: savedComment._id } }
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "Comment has been created",
    });
  }, 10000); // Set timeout to 10000ms

  test("should return 400 if validation fails", async () => {
    const reqBody = {
      articleId: "", // Invalid articleId
      comment: "", // Empty comment
    };

    const response = await supertest(app)
      .post("/comments")
      .send(reqBody);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errors: expect.any(Array),
    });
  }, 10000); // Set timeout to 10000ms

  test("should return 500 if there is an error while saving comment", async () => {
    const reqBody = {
      articleId: "60c72b2f9b1d4c3c4c8e1f30",
      comment: "This is a test comment",
    };

    Comment.prototype.save = jest.fn().mockRejectedValue(new Error("Save error"));

    const response = await supertest(app)
      .post("/comments")
      .send(reqBody);

    expect(Comment.prototype.save).toHaveBeenCalled();
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Save error",
    });
  }, 10000); // Set timeout to 10000ms

  test("should return 500 if there is an error while updating the article", async () => {
    const reqBody = {
      articleId: "60c72b2f9b1d4c3c4c8e1f30",
      comment: "This is a test comment",
    };

    const savedComment = new Comment({ ...reqBody, user: "1234567890" });
    Comment.prototype.save = jest.fn().mockResolvedValue(savedComment);
    Article.findOneAndUpdate = jest.fn().mockRejectedValue(new Error("Update error"));

    const response = await supertest(app)
      .post("/comments")
      .send(reqBody);

    expect(Comment.prototype.save).toHaveBeenCalled();
    expect(Article.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: reqBody.articleId },
      { $push: { comment: savedComment._id } }
    );
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Update error",
    });
  }, 10000); // Set timeout to 10000ms

  test("should get comments by post ID successfully", async () => {
    const articleId = "60c72b2f9b1d4c3c4c8e1f30";
    const comments = [
      { _id: "commentId1", description: "This is a comment" },
      { _id: "commentId2", description: "This is another comment" }
    ];

    const article = {
      _id: articleId,
      comment: comments
    };

    Article.findOne = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(article)
    });

    const response = await supertest(app)
      .get(`/comments/${articleId}`)
      .send();

    expect(Article.findOne).toHaveBeenCalledWith({ _id: articleId });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      comments: article.comment,
    });
  }, 10000); // Set timeout to 10000ms

  test("should return 500 if there is an error while getting comments by post ID", async () => {
    const articleId = "60c72b2f9b1d4c3c4c8e1f30";

    Article.findOne = jest.fn().mockReturnValue({
      populate: jest.fn().mockRejectedValue(new Error("Find error"))
    });

    const response = await supertest(app)
      .get(`/comments/${articleId}`)
      .send();

    expect(Article.findOne).toHaveBeenCalledWith({ _id: articleId });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Find error",
    });
  }, 10000); // Set timeout to 10000ms
});
