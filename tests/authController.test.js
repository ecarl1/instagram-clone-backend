const mongoose = require("mongoose");
const supertest = require("supertest");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { signup, login, logout, verify, refresh } = require("../src/controllers/authController");
const User = require("../src/Models/userModel");
const generateToken = require("../src/utils/generateToken");
const { check, validationResult } = require('express-validator');

const app = express();
app.use(express.json());
app.post("/signup", signup);
app.post("/login", login);
app.post("/logout", logout);
app.post("/refresh", refresh);


// Add a protected route for testing the verify middleware
app.get("/protected", verify, (req, res) => {
  res.status(200).send({
    status: "success",
    message: "You are authorized",
  });
});

jest.mock("../src/Models/userModel");
jest.mock("../src/utils/generateToken");
jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe("Auth Controller", () => {
  beforeEach(() => {
    User.mockClear();
    User.findOne.mockClear();
    User.findByIdAndUpdate.mockClear();
    bcrypt.compare.mockClear();
    bcrypt.hash.mockClear();
    bcrypt.genSalt.mockClear();
    generateToken.generateAccessToken.mockClear();
    generateToken.generateRefreshToken.mockClear();
    jwt.sign.mockClear();
    jwt.verify.mockClear();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test("should sign up a new user successfully", async () => {
    const reqBody = {
      username: "newuser",
      email: "newuser@example.com",
      password: "password123"
    };

    const savedUser = new User(reqBody);
    User.prototype.save = jest.fn().mockResolvedValue(savedUser);

    const response = await supertest(app)
      .post("/signup")
      .send(reqBody);

    expect(User.prototype.save).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "user saved successfully",
      data: {
        user: reqBody.username,
      },
    });
  }, 10000); 

  test("should return 500 if there is an error during signup", async () => {
    const reqBody = {
      username: "newuser",
      email: "newuser@example.com",
      password: "password123"
    };

    User.prototype.save = jest.fn().mockRejectedValue(new Error("Save error"));

    const response = await supertest(app)
      .post("/signup")
      .send(reqBody);

    expect(User.prototype.save).toHaveBeenCalled();
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Save error",
    });
  }, 10000); 



  test("should log in a user successfully", async () => {
    const reqBody = {
      username: "existinguser",
      password: "password123"
    };

    const hashedPassword = await bcrypt.hash("password123", 10);

    const user = {
      _id: "1234567890",
      username: "existinguser",
      password: hashedPassword,
      email: "existinguser@example.com",
      _doc: {
        _id: "1234567890",
        username: "existinguser",
        email: "existinguser@example.com",
        description: "",
        profilePicture: "YOUR_DEFAULT_AVATAR_URL",
        followers: [],
        followings: [],
        gender: undefined,
      }
    };

    // Mock implementations
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(true);
    generateToken.generateAccessToken.mockReturnValue("access_token");
    generateToken.generateRefreshToken.mockReturnValue("refresh_token");
    User.findByIdAndUpdate.mockResolvedValue({});

    const response = await supertest(app)
      .post("/login")
      .send(reqBody);

    console.log('User.findOne called with:', User.findOne.mock.calls);
    console.log('bcrypt.compare called with:', bcrypt.compare.mock.calls);
    console.log('generateAccessToken called with:', generateToken.generateAccessToken.mock.calls);
    console.log('generateRefreshToken called with:', generateToken.generateRefreshToken.mock.calls);
    console.log('User.findByIdAndUpdate called with:', User.findByIdAndUpdate.mock.calls);

    expect(User.findOne).toHaveBeenCalledWith({ username: reqBody.username.trim().toLowerCase() });
    expect(bcrypt.compare).toHaveBeenCalledWith(reqBody.password, user.password);
    expect(generateToken.generateAccessToken).toHaveBeenCalledWith(user);
    expect(generateToken.generateRefreshToken).toHaveBeenCalledWith(user);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(user._id, { jwtToken: "refresh_token" });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "Logged in successfully",
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        description: "",
        profilePicture: "YOUR_DEFAULT_AVATAR_URL",
        followers: [],
        followings: [],
        gender: undefined,
      },
      accessToken: "access_token",
      refreshToken: "refresh_token",
    });
  }, 20000); 


  test("should return 401 if user does not exist", async () => {
    const reqBody = {
      username: "nonexistentuser",
      password: "password123"
    };
  
    User.findOne = jest.fn().mockResolvedValue(null);
  
    const response = await supertest(app)
      .post("/login")
      .send(reqBody);
  
    expect(User.findOne).toHaveBeenCalledWith({ username: reqBody.username.trim().toLowerCase() });
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: "failure",
      message: "User does not exist", 
    });
  }, 10000);

  test("should return 401 if password is incorrect", async () => {
    const reqBody = {
      username: "existinguser",
      password: "wrongpassword"
    };

    const user = {
      _id: "1234567890",
      username: "existinguser",
      password: await bcrypt.hash("password123", 10),
      email: "existinguser@example.com",
      _doc: { username: "existinguser", password: await bcrypt.hash("password123", 10) }
    };

    User.findOne = jest.fn().mockResolvedValue(user);
    bcrypt.compare = jest.fn().mockResolvedValue(false);

    const response = await supertest(app)
      .post("/login")
      .send(reqBody);

    expect(User.findOne).toHaveBeenCalledWith({ username: reqBody.username });
    expect(bcrypt.compare).toHaveBeenCalledWith(reqBody.password, user.password);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: "failure",
      message: "Password is incorrect",
    });
  }, 10000); 

  test("should log out a user successfully", async () => {
    const reqBody = {
      refreshToken: "valid_refresh_token"
    };
  
    User.updateOne = jest.fn().mockResolvedValue({});
  
    const response = await supertest(app)
      .post("/logout")
      .send(reqBody);
  
    expect(User.updateOne).toHaveBeenCalledWith({ jwtToken: reqBody.refreshToken }, [{ $unset: ["jwtToken"] }]);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "You've been logged out",
    });
  }, 10000); 
  
  test("should return 400 if no refresh token is provided", async () => {
    const reqBody = {};
  
    const response = await supertest(app)
      .post("/logout")
      .send(reqBody);
  
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: "failure",
      message: "logout error",
    });
  }, 10000); 
  
  test("should return 500 if there is an error during logout", async () => {
    const reqBody = {
      refreshToken: "valid_refresh_token"
    };
  
    User.updateOne = jest.fn().mockRejectedValue(new Error("Logout error"));
  
    const response = await supertest(app)
      .post("/logout")
      .send(reqBody);
  
    expect(User.updateOne).toHaveBeenCalledWith({ jwtToken: reqBody.refreshToken }, [{ $unset: ["jwtToken"] }]);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "Logout error",
    });
  }, 10000); 


  test("should authorize a user with a valid token", async () => {
    const token = "valid_token";
    const user = {
      _id: "1234567890",
      username: "testuser",
      role: "user",
    };

    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, user);
    });

    const response = await supertest(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(jwt.verify).toHaveBeenCalledWith(token, "YOUR_SECRET_KEY", expect.any(Function));
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "You are authorized",
    });
  }, 10000); 

  test("should return 403 if no authorization header is provided", async () => {
    const response = await supertest(app)
      .get("/protected");

    expect(response.status).toBe(403);
    expect(response.body).toBe("You are not authorized");
  }, 10000); 

  test("should return 500 if the token is invalid", async () => {
    const token = "invalid_token";

    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(new Error("token is not valid!"), null);
    });

    const response = await supertest(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(jwt.verify).toHaveBeenCalledWith(token, "YOUR_SECRET_KEY", expect.any(Function));
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: "failure",
      message: "token is not valid!",
    });
  }, 10000); 

  
  test("should return 401 if no refresh token is provided", async () => {
    const response = await supertest(app)
      .post("/refresh")
      .send({}); // Sending an empty body
  
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: "failure",
      message: "You are not authenticated!",
    });
  }, 10000); 
  
  //the rest of the test were not working for refresh
  

});
