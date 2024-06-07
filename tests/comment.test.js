const mongoose = require("mongoose");
const connectDB = require("../src/configs/db");
const Comment = require("../src/Models/commentModel");
const User = require("../src/Models/userModel");

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Comment Model Test", () => {
  let user;

  beforeEach(async () => {
    user = new User({ username: `testuser_${Date.now()}`, email: `testuser_${Date.now()}@example.com`, password: "password123" });
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

  test("should save a comment even if required fields are missing", async () => {
    const comment = new Comment();

    const savedComment = await comment.save();

    expect(savedComment._id).toBeDefined();
  });
});
