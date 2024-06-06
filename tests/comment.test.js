const mongoose = require("mongoose");
const connectDB = require("../configs/db");
const Comment = require("../Models/commentModel");
const User = require("../Models/userModel");

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

describe("Comment Model Test", () => {
  let user;

  beforeEach(async () => {
    user = new User({ username: "testuser", email: "testuser@example.com", password: "password123" });
    await user.save();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Comment.deleteMany({});
  });

  test("should create and save a comment successfully", async () => {
    const commentData = {
      user: user._id,
      description: "Sample comment",
    };

    const comment = new Comment(commentData);
    const savedComment = await comment.save();

    expect(savedComment._id).toBeDefined();
    expect(savedComment.user.toString()).toBe(commentData.user.toString());
    expect(savedComment.description).toBe(commentData.description);
  });

  test("should fail if required fields are missing", async () => {
    const comment = new Comment();

    await expect(comment.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

});
