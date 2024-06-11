const mongoose = require("mongoose");
const supertest = require("supertest");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { signup } = require("../src/controllers/authController");
const User = require("../src/Models/userModel");
const generateToken = require("../src/utils/generateToken");

const app = express();
app.use(express.json());
app.post("/signup", signup);

jest.mock("../src/Models/userModel");
jest.mock("../src/utils/generateToken");

describe("Auth Controller", () => {
  beforeEach(() => {
    User.mockClear();
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
  }, 10000); // Set timeout to 10000ms

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
  }, 10000); // Set timeout to 10000ms
});
