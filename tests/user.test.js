const mongoose = require("mongoose");
const connectDB = require("../configs/db");
const User = require("../Models/userModel");

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

describe("User Model Test", () => {
  afterEach(async () => {
    await User.deleteMany({});
  });

  test("should create and save a user successfully", async () => {
    const userData = {
      username: "testuser",
      email: "testuser@example.com",
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
      username: "uniqueuser",
      email: "unique@example.com",
      password: "password123",
      role: "user",
    };
    const user1 = new User(userData);
    await user1.save();

    const user2 = new User(userData);

    await expect(user2.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

});
