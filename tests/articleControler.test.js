const mongoose = require("mongoose");
const supertest = require("supertest");
const express = require("express");
const { createArticle, updateArticle, deleteArticle, getTimeline, getArticlesUser, getArticle, likeUnlike } = require("../src/controllers/articleController");
const Article = require("../src/Models/articleModel");
const Comment = require("../src/Models/commentModel");
const User = require("../src/Models/userModel");

const app = express();
app.use(express.json());
app.post("/articles", (req, res, next) => {
  req.user = { _id: "1234567890" }; // Mocking req.user for createArticle
  next();
}, createArticle);

app.put("/articles/:id/like", (req, res, next) => {
  req.user = { _id: "1234567890" }; 
  next();
}, likeUnlike);


app.get("/articles/:id", (req, res, next) => {
  req.user = { _id: "1234567890" }; 
  next();
}, getArticle);

app.get("/articles/user/:username", (req, res, next) => {
    req.user = { _id: "1234567890" }; 
    next();
  }, getArticlesUser);

app.put("/articles/:id", (req, res, next) => {
  req.user = { _id: "1234567890" }; // Mocking req.user for updateArticle
  next();
}, updateArticle);

app.delete("/articles/:id", (req, res, next) => {
  req.user = { _id: "1234567890", role: "user" }; // Mocking req.user for deleteArticle
  next();
}, deleteArticle);

app.get("/timeline", (req, res, next) => {
  req.user = { _id: "1234567890" }; // Mocking req.user for getTimeline
  next();
}, getTimeline);

jest.mock("../src/Models/articleModel");
jest.mock("../src/Models/commentModel");
jest.mock("../src/Models/userModel");

describe("Article Controller", () => {
  beforeEach(() => {
    Article.mockClear();
    Comment.mockClear();
    User.mockClear();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test("should create and save an article successfully", async () => {
    const reqBody = {
      title: "Test Article",
      description: "This is a test article",
      imgurl: "http://example.com/image.jpg",
    };

    const newArticle = new Article({ ...reqBody, user: "1234567890" });
    Article.prototype.save = jest.fn().mockResolvedValue(newArticle);

    const response = await supertest(app)
      .post("/articles")
      .send(reqBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "article has been created",
    });
    expect(Article.prototype.save).toHaveBeenCalled();
  }, 10000); 

  test("should return 500 if there is an error", async () => {
    const reqBody = {
      title: "Test Article",
      description: "This is a test article",
      imgurl: "http://example.com/image.jpg",
    };

    Article.prototype.save = jest.fn().mockRejectedValue(new Error("Save error"));

    const response = await supertest(app)
      .post("/articles")
      .send(reqBody);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Save error",
    });
  }, 10000); 

  test("should update an article successfully", async () => {
    const articleId = "60c72b2f9b1d4c3c4c8e1f30";
    const article = {
      _id: articleId,
      title: "Original Title",
      content: "Original content",
      tags: ["original"],
      user: "1234567890",
      save: jest.fn().mockResolvedValue({}), // Mock save method
    };
    const reqBody = {
      title: "Updated Title",
      content: "Updated content",
    };
  
    // Mock the necessary methods
    Article.findById = jest.fn().mockResolvedValue(article);
  
    // Make the request
    const response = await supertest(app)
      .put(`/articles/${articleId}`)
      .send(reqBody);
  
    // Check if Article.findById was called with the correct argument
    expect(Article.findById).toHaveBeenCalledWith(articleId);
    // Check if the article.save method was called
    expect(article.save).toHaveBeenCalled();
    // Check the response
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "article has been updated",
    });
  
    // Check that the article fields were updated correctly
    expect(article.title).toBe(reqBody.title);
    expect(article.content).toBe(reqBody.content);
  }, 10000); 
  
  
  

  test("should return 401 if user is not authorized to update the article", async () => {
    const articleId = "60c72b2f9b1d4c3c4c8e1f30";
    const article = {
      _id: articleId,
      title: "Original Title",
      description: "Original description",
      user: "anotherUserId"
    };
    const reqBody = {
      title: "Updated Title",
      description: "Updated description"
    };

    Article.findById = jest.fn().mockResolvedValue(article);

    const response = await supertest(app)
      .put(`/articles/${articleId}`)
      .send(reqBody);

    expect(Article.findById).toHaveBeenCalledWith(articleId);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: "failure",
      message: "you are not authorized",
    });
  }, 10000); 

  test("should return 500 if there is an error while updating the article", async () => {
    const articleId = "60c72b2f9b1d4c3c4c8e1f30";
    const reqBody = {
      title: "Updated Title",
      description: "Updated description"
    };

    Article.findById = jest.fn().mockRejectedValue(new Error("Find error"));

    const response = await supertest(app)
      .put(`/articles/${articleId}`)
      .send(reqBody);

    expect(Article.findById).toHaveBeenCalledWith(articleId);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Find error",
    });
  }, 10000); 

  test("should delete an article successfully", async () => {
    const articleId = "60c72b2f9b1d4c3c4c8e1f30";
    const article = {
      _id: articleId,
      user: "1234567890"
    };

    Article.findById = jest.fn().mockResolvedValue(article);
    Comment.deleteMany = jest.fn().mockResolvedValue({});
    Article.findByIdAndDelete = jest.fn().mockResolvedValue({});

    const response = await supertest(app)
      .delete(`/articles/${articleId}`)
      .send();

    expect(Article.findById).toHaveBeenCalledWith(articleId);
    expect(Comment.deleteMany).toHaveBeenCalledWith({ user: "1234567890" });
    expect(Article.findByIdAndDelete).toHaveBeenCalledWith(articleId);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "article has been deleted",
    });
  }, 10000); 

  test("should return 401 if user is not authorized to delete the article", async () => {
    const articleId = "60c72b2f9b1d4c3c4c8e1f30";
    const article = {
      _id: articleId,
      user: "anotherUserId"
    };

    Article.findById = jest.fn().mockResolvedValue(article);

    const response = await supertest(app)
      .delete(`/articles/${articleId}`)
      .send();

    expect(Article.findById).toHaveBeenCalledWith(articleId);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: "failure",
      message: "you are not authorized",
    });
  }, 10000); 

  test("should return 500 if there is an error while deleting the article", async () => {
    const articleId = "60c72b2f9b1d4c3c4c8e1f30";

    Article.findById = jest.fn().mockRejectedValue(new Error("Find error"));

    const response = await supertest(app)
      .delete(`/articles/${articleId}`)
      .send();

    expect(Article.findById).toHaveBeenCalledWith(articleId);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Find error",
    });
  }, 10000); 

  test("should get timeline articles successfully", async () => {
    const userid = "1234567890";
    const user = {
      _id: userid,
      followings: ["followId1", "followId2"]
    };
  
    const myArticles = [
      {
        _id: "articleId1",
        user: userid,
        title: "My Article",
        description: "This is my article",
        createdAt: new Date().toISOString(),
      }
    ];
  
    const followingsArticles = [
      [
        {
          _id: "articleId2",
          user: "followId1",
          title: "Following Article",
          description: "This is a following article",
          createdAt: new Date().toISOString(),
        }
      ],
      [
        {
          _id: "articleId3",
          user: "followId2",
          title: "Another Following Article",
          description: "This is another following article",
          createdAt: new Date().toISOString(),
        }
      ]
    ];
  
    User.findById.mockImplementation(() => ({
      select: jest.fn().mockResolvedValue(user)
    }));
  
    Article.find.mockImplementation((query) => {
      if (query.user === userid) {
        return {
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          populate: jest.fn().mockResolvedValue(myArticles)
        };
      } else if (user.followings.includes(query.user)) {
        return {
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          populate: jest.fn().mockResolvedValue(followingsArticles[user.followings.indexOf(query.user)])
        };
      }
      return {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([])
      };
    });
  
    const response = await supertest(app)
      .get("/timeline")
      .query({ page: 1, limit: 1 });
  
    expect(User.findById).toHaveBeenCalledWith(userid);
    expect(Article.find).toHaveBeenCalledTimes(3);
    expect(response.status).toBe(200);
  
    // Compare directly
    const expectedArticles = myArticles.concat(...followingsArticles);
    const receivedArticles = response.body.Articles;
  
    expect(response.body.status).toBe("success");
    expect(receivedArticles).toEqual(expectedArticles);
    expect(response.body.limit).toBe(expectedArticles.length);
  }, 10000); 
  
  test("should return 500 if there is an error while getting timeline", async () => {
    User.findById.mockImplementation(() => ({
      select: jest.fn().mockRejectedValue(new Error("Find error"))
    }));

    const response = await supertest(app)
      .get("/timeline")
      .query({ page: 1, limit: 1 });

    expect(User.findById).toHaveBeenCalledWith("1234567890");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Find error",
    });
  }, 10000); 

  test("should get articles by user successfully", async () => {
    const username = "testuser";
    const user = {
      _id: "1234567890",
      username: "testuser"
    };
  
    const articles = [
      {
        _id: "articleId1",
        user: user._id,
        title: "User's Article",
        description: "This is an article by the user",
        createdAt: new Date().toISOString(),
      },
      {
        _id: "articleId2",
        user: user._id,
        title: "Another Article",
        description: "This is another article by the user",
        createdAt: new Date().toISOString(),
      }
    ];
  
    User.findOne.mockResolvedValue(user);
    Article.find.mockResolvedValue(articles);
  
    const response = await supertest(app)
      .get(`/articles/user/${username}`)
      .send();
  
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(Article.find).toHaveBeenCalledWith({ user: user._id });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(articles);
  }, 10000); 
  
  test("should return 500 if there is an error while getting user's articles", async () => {
    const username = "testuser";
  
    User.findOne.mockRejectedValue(new Error("Find error"));
  
    const response = await supertest(app)
      .get(`/articles/user/${username}`)
      .send();
  
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Find error",
    });
  }, 10000); 

  
  test("should get an article successfully", async () => {
    const articleId = "60c72b2f9b1d4c3c4c8e1f30";
    const article = {
      _id: articleId,
      title: "Test Article",
      description: "This is a test article",
      comments: [
        {
          _id: "commentId1",
          text: "This is a comment",
          user: "userId1"
        }
      ],
      createdAt: new Date().toISOString()
    };
  
    Article.findOne.mockImplementation(() => ({
      populate: jest.fn().mockResolvedValue(article)
    }));
  
    const response = await supertest(app)
      .get(`/articles/${articleId}`)
      .send();
  
    expect(Article.findOne).toHaveBeenCalledWith({ _id: articleId });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(article);
  }, 10000); 
  
  test("should return 500 if there is an error while getting the article", async () => {
    const articleId = "60c72b2f9b1d4c3c4c8e1f30";
  
    Article.findOne.mockImplementation(() => ({
      populate: jest.fn().mockRejectedValue(new Error("Find error"))
    }));
  
    const response = await supertest(app)
      .get(`/articles/${articleId}`)
      .send();
  
    expect(Article.findOne).toHaveBeenCalledWith({ _id: articleId });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Find error",
    });
  }, 10000); 
  

  test("should like an article successfully", async () => {
    const articleId = "60c72b2f9b1d4c3c4c8e1f30";
    const userId = "1234567890";
    
    const article = {
      _id: articleId,
      likes: [],
      updateOne: jest.fn().mockResolvedValue({}),
    };
    
    Article.findById = jest.fn().mockResolvedValue(article);
  
    const response = await supertest(app)
      .put(`/articles/${articleId}/like`)
      .set('Authorization', `Bearer valid-token`);
    
    console.log('Article.findById calls:', Article.findById.mock.calls);
    expect(Article.findById).toHaveBeenCalledWith(articleId);
    expect(article.updateOne).toHaveBeenCalledWith({ $push: { likes: userId } });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "the article has been liked",
    });
  }, 10000); 

test("should dislike an article successfully", async () => {
    const articleId = "60c72b2f9b1d4c3c4c8e1f30";
    const userId = "1234567890";
    
    const article = {
      _id: articleId,
      likes: [userId],
      updateOne: jest.fn().mockResolvedValue({}),
    };
    
    Article.findById = jest.fn().mockResolvedValue(article);
  
    const response = await supertest(app)
      .put(`/articles/${articleId}/like`)
      .set('Authorization', `Bearer valid-token`);
    
    console.log('Article.findById calls:', Article.findById.mock.calls);
    expect(Article.findById).toHaveBeenCalledWith(articleId);
    expect(article.updateOne).toHaveBeenCalledWith({ $pull: { likes: userId } });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "the article has been disliked",
    });
  }, 10000);

test("should return 500 if there is an error", async () => {
    const articleId = "60c72b2f9b1d4c3c4c8e1f30";
    
    Article.findById = jest.fn().mockRejectedValue(new Error("Find error"));
  
    const response = await supertest(app)
      .put(`/articles/${articleId}/like`)
      .set('Authorization', `Bearer valid-token`);
    
    console.log('Article.findById calls:', Article.findById.mock.calls);
    expect(Article.findById).toHaveBeenCalledWith(articleId);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Find error",
    });
  }, 10000); 


});
