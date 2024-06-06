const mongoose = require("mongoose");
const connectDB = require("../configs/db");
const Article = require("../Models/articleModel");
const User = require("../Models/userModel");
const Comment = require("../Models/commentModel");

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

describe("Article Model Test", () => {
  let user, comment;

  beforeEach(async () => {
    user = new User({ username: "testuser", email: "testuser@example.com", password: "password123" });
    await user.save();

    comment = new Comment({ text: "Test comment", user: user._id });
    await comment.save();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Comment.deleteMany({});
    await Article.deleteMany({});
  });

  test("should create and save an article successfully", async () => {
    const articleData = {
      user: user._id,
      description: "Sample description",
      imgurl: "http://example.com/image.jpg",
      likes: [user._id],
      comment: [comment._id],
    };

    const article = new Article(articleData);
    const savedArticle = await article.save();

    expect(savedArticle._id).toBeDefined();
    expect(savedArticle.user.toString()).toBe(articleData.user.toString());
    expect(savedArticle.description).toBe(articleData.description);
    expect(savedArticle.imgurl).toBe(articleData.imgurl);
    expect(savedArticle.likes.map(id => id.toString())).toContain(articleData.likes[0].toString());
    expect(savedArticle.comment.map(id => id.toString())).toContain(articleData.comment[0].toString());
  });

  test("should fail if required fields are missing", async () => {
    const article = new Article();

    await expect(article.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

});
