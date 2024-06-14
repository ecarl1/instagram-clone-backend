const express = require("express");
const bcrypt = require("bcrypt");
const supertest = require("supertest");
const mongoose = require("mongoose");
const { updateUser, getUser, getUserByUsername, getFollowings, getFollowers, followUser, unfollowUser, searchUsers } = require("../src/controllers/userController");
const User = require("../src/Models/userModel");

const app = express();
app.use(express.json());

app.get("/users/search", searchUsers);


app.put("/users/:id", (req, res, next) => {
  req.user = { _id: "1234567890", role: "user" }; // Mocking req.user
  next();
}, updateUser);
app.get("/users/followings/:username", getFollowings);

app.get("/users/:id", getUser);
app.get("/users/u/:username", getUserByUsername);

app.get("/users/followers/:username", getFollowers);

app.put("/users/:username/unfollow", (req, res, next) => {
    req.user = { _id: "1234567890" }; // Mocking req.user for unfollowUser
    next();
  }, unfollowUser);
  

app.put("/users/:username/follow", (req, res, next) => {
    req.user = { _id: "1234567890" }; // Mocking req.user for followUser
    next();
  }, followUser);
  


jest.mock("../src/Models/userModel");

describe("User Controller", () => {
    beforeEach(() => {
        User.findOne.mockClear();
        User.findById.mockClear();
      });
    
  afterAll(async () => {
    await mongoose.disconnect();
  });

  test("should update a user successfully", async () => {
    const userId = "1234567890";
    const reqBody = {
      username: "updatedUser",
      password: "newPassword123",
    };

    const user = {
      _id: userId,
      username: reqBody.username,
      password: await bcrypt.hash(reqBody.password, 10),
      role: "user",
      _doc: {
        _id: userId,
        username: reqBody.username,
        profilePicture: "YOUR_DEFAULT_AVATAR_URL",
      },
    };

    User.findOneAndUpdate.mockResolvedValue(user);

    const response = await supertest(app)
      .put(`/users/${userId}`)
      .send(reqBody);

    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: userId },
      { $set: expect.any(Object) },
      { new: true }
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "Account has been updated successfully",
      user: {
        _id: userId,
        username: reqBody.username,
        profilePicture: "YOUR_DEFAULT_AVATAR_URL",
      },
    });
  }, 10000); // Set timeout to 10000ms

  test("should return 400 if user is not authorized to update the account", async () => {
    const reqBody = {
      username: "updatedUser",
      password: "newPassword123",
    };

    const response = await supertest(app)
      .put(`/users/otherUserId`)
      .send(reqBody);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: "failure",
      message: "you can't update this account.",
    });
  }, 10000); // Set timeout to 10000ms

  test("should return 500 if there is an error while updating the user", async () => {
    const userId = "1234567890";
    const reqBody = {
      username: "updatedUser",
      password: "newPassword123",
    };

    User.findOneAndUpdate.mockRejectedValue(new Error("Update error"));

    const response = await supertest(app)
      .put(`/users/${userId}`)
      .send(reqBody);

    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: userId },
      { $set: expect.any(Object) },
      { new: true }
    );
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "something is wrong !",
    });
  }, 10000); // Set timeout to 10000ms

  test("should get a user successfully", async () => {
    const userId = "1234567890";
    const user = {
      _id: userId,
      username: "testuser",
      email: "testuser@example.com",
      profilePicture: "YOUR_DEFAULT_AVATAR_URL",
      description: "This is a test user",
      followers: [],
      followings: [],
      gender: "male",
      _doc: {
        _id: userId,
        username: "testuser",
        email: "testuser@example.com",
        profilePicture: "YOUR_DEFAULT_AVATAR_URL",
        description: "This is a test user",
        followers: [],
        followings: [],
        gender: "male"
      }
    };

    User.findOne.mockResolvedValue(user);

    const response = await supertest(app)
      .get(`/users/${userId}`)
      .send();

    expect(User.findOne).toHaveBeenCalledWith({ _id: userId });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "user info",
      user: {
        _id: userId,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        description: user.description,
        followers: user.followers,
        followings: user.followings,
        gender: user.gender
      },
    });
  }, 10000); // Set timeout to 10000ms

  test("should return 500 if there is an error while getting the user", async () => {
    const userId = "1234567890";

    User.findOne.mockRejectedValue(new Error("Find error"));

    const response = await supertest(app)
      .get(`/users/${userId}`)
      .send();

    expect(User.findOne).toHaveBeenCalledWith({ _id: userId });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Find error",
    });
  }, 10000); // Set timeout to 10000ms

  test("should return 500 if user does not exist", async () => {
    const userId = "1234567890";

    User.findOne.mockResolvedValue(null);

    const response = await supertest(app)
      .get(`/users/${userId}`)
      .send();

    expect(User.findOne).toHaveBeenCalledWith({ _id: userId });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "user does not exist",
    });
  }, 10000); // Set timeout to 10000ms


  test("should get a user by username successfully", async () => {
    const username = "testuser";
    const user = {
      _id: "1234567890",
      username: "testuser",
      email: "testuser@example.com",
      profilePicture: "YOUR_DEFAULT_AVATAR_URL",
      description: "This is a test user",
      followers: [],
      followings: [],
      gender: "male",
      _doc: {
        _id: "1234567890",
        username: "testuser",
        email: "testuser@example.com",
        profilePicture: "YOUR_DEFAULT_AVATAR_URL",
        description: "This is a test user",
        followers: [],
        followings: [],
        gender: "male"
      }
    };

    User.findOne.mockResolvedValue(user);

    const response = await supertest(app)
      .get(`/users/u/${username}`)
      .send();

    //console.log(User.findOne.mock.calls); // Added for debugging
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "user info",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        description: user.description,
        followers: user.followers,
        followings: user.followings,
        gender: user.gender
      },
    });
  }, 10000); // Set timeout to 10000ms

  test("should return 500 if there is an error while getting the user by username", async () => {
    const username = "testuser";

    User.findOne.mockRejectedValue(new Error("Find error"));

    const response = await supertest(app)
      .get(`/users/u/${username}`)
      .send();

    //console.log(User.findOne.mock.calls); // Added for debugging
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Find error",
    });
  }, 10000); // Set timeout to 10000ms

  test("should return 500 if user by username does not exist", async () => {
    const username = "testuser";

    User.findOne.mockResolvedValue(null);

    const response = await supertest(app)
      .get(`/users/u/${username}`)
      .send();

    //console.log(User.findOne.mock.calls); // Added for debugging
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "user does not exist",
    });
  }, 10000); // Set timeout to 10000ms

test("should get followings of a user successfully", async () => {
    const username = "testuser";
    const userfollowings = {
      _id: "1234567890",
      username: "testuser",
      followings: ["followingId1", "followingId2"]
    };
    const followings = [
      {
        _id: "followingId1",
        username: "followinguser1",
        profilePicture: "http://example.com/following1.jpg"
      },
      {
        _id: "followingId2",
        username: "followinguser2",
        profilePicture: "http://example.com/following2.jpg"
      }
    ];
  
    User.findOne.mockResolvedValue(userfollowings);
    User.findById
      .mockResolvedValueOnce(followings[0])
      .mockResolvedValueOnce(followings[1]);
  
    const response = await supertest(app)
      .get(`/users/followings/${username}`)
      .send();
  
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(User.findById).toHaveBeenCalledTimes(userfollowings.followings.length);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "user info",
      followings: followings,
    });
  }, 10000); // Set timeout to 10000ms
  
test("should return 500 if there is an error while getting followings", async () => {
    const username = "testuser";
  
    User.findOne.mockRejectedValue(new Error("Find error"));
  
    const response = await supertest(app)
      .get(`/users/followings/${username}`)
      .send();
  
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Find error",
    });
  }, 10000); // Set timeout to 10000ms

  // Add this to userController.test.js
test("should return 500 if user does not exist while getting followings", async () => {
    const username = "testuser";
  
    User.findOne.mockResolvedValue(null);
  
    const response = await supertest(app)
      .get(`/users/followings/${username}`)
      .send();
  
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "user does not exist",
    });
  }, 10000); // Set timeout to 10000ms
  
  test("should get followers of a user successfully", async () => {
    const username = "testuser";
    const userfollowers = {
      _id: "1234567890",
      username: "testuser",
      followers: ["followerId1", "followerId2"]
    };
    const followers = [
      {
        _id: "followerId1",
        username: "followeruser1",
        profilePicture: "http://example.com/follower1.jpg"
      },
      {
        _id: "followerId2",
        username: "followeruser2",
        profilePicture: "http://example.com/follower2.jpg"
      }
    ];
  
    User.findOne.mockResolvedValue(userfollowers);
    User.findById
      .mockResolvedValueOnce(followers[0])
      .mockResolvedValueOnce(followers[1]);
  
    const response = await supertest(app)
      .get(`/users/followers/${username}`)
      .send();
  
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(User.findById.mock.calls.length).toBe(userfollowers.followers.length);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "user info",
      data: {
        followings: followers,
      },
    });
  }, 10000); // Set timeout to 10000ms
  

  test("should return 500 if there is an error while getting followers", async () => {
    const username = "testuser";
  
    User.findOne.mockRejectedValue(new Error("Find error"));
  
    const response = await supertest(app)
      .get(`/users/followers/${username}`)
      .send();
  
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Find error",
    });
  }, 10000); // Set timeout to 10000ms

  test("should return 500 if user does not exist while getting followers", async () => {
    const username = "testuser";
  
    User.findOne.mockResolvedValue(null);
  
    const response = await supertest(app)
      .get(`/users/followers/${username}`)
      .send();
  
    expect(User.findOne).toHaveBeenCalledWith({ username });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "user does not exist",
    });
  }, 10000); // Set timeout to 10000ms
  
  test("should follow a user successfully", async () => {
    const currentUser = {
      _id: "1234567890",
      username: "currentuser",
      followings: [],
      updateOne: jest.fn().mockResolvedValue({})
    };
    const usertofollow = {
      _id: "0987654321",
      username: "usertofollow",
      followers: [],
      updateOne: jest.fn().mockResolvedValue({})
    };
  
    User.findById.mockResolvedValue(currentUser);
    User.findOne.mockResolvedValue(usertofollow);
  
    const response = await supertest(app)
      .put(`/users/${usertofollow.username}/follow`)
      .send();
  
    expect(User.findById).toHaveBeenCalledWith({ _id: "1234567890" });
    expect(User.findOne).toHaveBeenCalledWith({ username: usertofollow.username });
    expect(currentUser.updateOne).toHaveBeenCalledWith({
      $push: { followings: usertofollow._id }
    });
    expect(usertofollow.updateOne).toHaveBeenCalledWith({
      $push: { followers: currentUser._id }
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "user has been followed",
    });
  }, 10000); // Set timeout to 10000ms
  

  test("should return 500 if there is an error while following user", async () => {
    const currentUser = {
      _id: "1234567890",
      username: "currentuser",
      followings: []
    };
  
    User.findById.mockRejectedValue(new Error("Find error"));
  
    const response = await supertest(app)
      .put(`/users/testuser/follow`)
      .send();
  
    expect(User.findById).toHaveBeenCalledWith({ _id: "1234567890" });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Find error",
    });
  }, 10000); // Set timeout to 10000ms

  test("should return 500 if trying to follow oneself", async () => {
    const currentUser = {
      _id: "1234567890",
      username: "currentuser",
      followings: []
    };
  
    User.findById.mockResolvedValue(currentUser);
  
    const response = await supertest(app)
      .put(`/users/currentuser/follow`)
      .send();
  
    expect(User.findById).toHaveBeenCalledWith({ _id: "1234567890" });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "you can't follow yourself",
    });
  }, 10000); // Set timeout to 10000ms
  
  test("should unfollow a user successfully", async () => {
    const currentUser = {
      _id: "1234567890",
      username: "currentuser",
      followings: ["0987654321"],
      updateOne: jest.fn().mockResolvedValue({})
    };
    const usertounfollow = {
      _id: "0987654321",
      username: "usertounfollow",
      followers: ["1234567890"],
      updateOne: jest.fn().mockResolvedValue({})
    };
  
    User.findById.mockResolvedValue(currentUser);
    User.findOne.mockResolvedValue(usertounfollow);
  
    const response = await supertest(app)
      .put(`/users/${usertounfollow.username}/unfollow`)
      .send();
  
    expect(User.findById).toHaveBeenCalledWith({ _id: "1234567890" });
    expect(User.findOne).toHaveBeenCalledWith({ username: usertounfollow.username });
    expect(currentUser.updateOne).toHaveBeenCalledWith({
      $pull: { followings: usertounfollow._id }
    });
    expect(usertounfollow.updateOne).toHaveBeenCalledWith({
      $pull: { followers: currentUser._id }
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "user has been unfollowed",
    });
  }, 10000); // Set timeout to 10000ms

  test("should return 500 if there is an error while unfollowing user", async () => {
    const currentUser = {
      _id: "1234567890",
      username: "currentuser",
      followings: ["0987654321"]
    };
  
    User.findById.mockRejectedValue(new Error("Find error"));
  
    const response = await supertest(app)
      .put(`/users/testuser/unfollow`)
      .send();
  
    expect(User.findById).toHaveBeenCalledWith({ _id: "1234567890" });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Find error",
    });
  }, 10000); // Set timeout to 10000ms

  test("should return 500 if trying to unfollow oneself", async () => {
    const currentUser = {
      _id: "1234567890",
      username: "currentuser",
      followings: ["0987654321"]
    };
  
    User.findById.mockResolvedValue(currentUser);
  
    const response = await supertest(app)
      .put(`/users/currentuser/unfollow`)
      .send();
  
    expect(User.findById).toHaveBeenCalledWith({ _id: "1234567890" });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "you can't unfollow yourself",
    });
  }, 10000); // Set timeout to 10000ms

  test("should search users successfully", async () => {
    const users = [
      {
        _id: "1234567890",
        username: "testuser1",
        profilePicture: "url1"
      },
      {
        _id: "0987654321",
        username: "testuser2",
        profilePicture: "url2"
      }
    ];
  
    User.find.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(users)
    }));
  
    const response = await supertest(app)
      .get("/users/search")
      .query({ search: "test", limit: 5 });
  
    expect(User.find).toHaveBeenCalledWith({
      username: { $regex: "test", $options: "i" }
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      totalUsers: users.length,
      limit: 5,
      users: users,
    });
  }, 10000); // Set timeout to 10000ms
  
  test("should return 500 if there is an error while searching users", async () => {
    User.find.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockRejectedValue(new Error("Find error"))
    }));
  
    const response = await supertest(app)
      .get("/users/search")
      .query({ search: "test", limit: 5 });
  
    expect(User.find).toHaveBeenCalledWith({
      username: { $regex: "test", $options: "i" }
    });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Find error",
    });
  }, 10000); // Set timeout to 10000ms
  
  
  
});
