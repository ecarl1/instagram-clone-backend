const mongoose = require("mongoose");
const connectDB = require("../src/configs/db");
const User = require("../src/Models/userModel");

beforeAll(async () => {
  await connectDB();
  await User.init(); // Ensure indexes are created
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("User Model Test", () => {
  afterEach(async () => {
    await User.deleteMany({});
  });

  test("should create and save a user successfully", async () => {
    const userData = {
      username: `testuser_${Date.now()}`,
      email: `testuser_${Date.now()}@example.com`,
      password: "password123",
      role: "user",
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(userData.username);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.password).toBe(userData.password);
    expect(savedUser.role).toBe(userData.role);
    expect(savedUser.description).toBe("");
    expect(savedUser.profilePicture).toBe("YOUR_DEFAULT_AVATAR_URL");
  });

  test("should fail if required fields are missing", async () => {
    const user = new User();

    await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test("should enforce unique constraints", async () => {
    const userData = {
      username: `uniqueuser_${Date.now()}`,
      email: `unique_${Date.now()}@example.com`,
      password: "password123",
      role: "user",
    };
    const user1 = new User(userData);
    await user1.save();

    const user2 = new User(userData);

    try {
      await user2.save();
    } catch (error) {
      expect(error).toBeInstanceOf(mongoose.Error);
      expect(error.code).toBe(11000); // 11000 is the code for duplicate key error in MongoDB
    }
  });
});
