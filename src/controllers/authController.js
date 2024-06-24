const bcrypt = require("bcrypt");
const User = require("../Models/userModel");
const jwt = require("jsonwebtoken");
const generateToken = require("../utils/generateToken");

const signup = async (req, res) => {
  try {
    const data = req.body;
    const { username, password, email } = data;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const createduser = new User({
      username: username,
      password: hashedPassword,
      email: email,
    });
    await createduser.save();
    res.status(200).send({
      status: "success",
      message: "user saved successfully",
      data: {
        user: username,
      },
    });
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: e.message,
    });
  }
};

const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const login = async (req, res) => {
  // Input validation
  await check('username', 'Username is required').notEmpty().run(req);
  await check('password', 'Password is required').notEmpty().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, password } = req.body;

    //jhj
    // Sanitize input to prevent injection attacks
    const sanitizedUsername = username.trim().toLowerCase();

    // Use parameterized queries to avoid NoSQL injection
    const user = await User.findOne({ username: sanitizedUsername });
    if (!user) {
      return res.status(401).send({
        status: "failure",
        message: "User does not exist",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).send({
        status: "failure",
        message: "Password is incorrect",
      });
    }

    const accessToken = generateToken.generateAccessToken(user);
    const refreshToken = generateToken.generateRefreshToken(user);
    await User.findByIdAndUpdate(user._id, {
      jwtToken: refreshToken,
    });

    const { jwtToken, password: newpass, ...other } = user._doc;
    res.status(200).send({
      status: "success",
      message: "Logged in successfully",
      data: other,
      accessToken,
      refreshToken,
    });
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: e.message,
    });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.updateOne({ jwtToken: refreshToken }, [
        { $unset: ["jwtToken"] },
      ]);
      res.status(200).send({
        status: "success",
        message: "You've been logged out",
      });
    } else {
      return res.status(400).send({
        status: "failure",
        message: "logout error",
      });
    }
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: e.message,
    });
  }
};

//updated this
//error occurs because the verify middleware does not return immediately after 
//sending the response when no authorization header is provided. Adding a return 
//statement to ensure that the function exits after sending the response resolved this issue.
const verify = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).json("You are not authorized");
  }
  const token = authHeader.split(" ")[1];
  try {
    if (authHeader) {
      jwt.verify(token, "YOUR_SECRET_KEY", (err, user) => {
        if (err) {
          throw new Error("token is not valid!");
        }
        req.user = user;
        next();
      });
    }
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: e.message,
    });
  }
};

//updated the refresh 
//The refresh function should return immediately after sending the 
//response if the refreshToken is not provided. 
//The issue arises because the current implementation does not return after 
//sending the response, causing the code to continue executing.
//Ensure that the function returns immediately after sending the response if no refreshToken is provided:
const refresh = async (req, res) => {
  const refreshToken = req.body.token;
  if (!refreshToken) {
    return res.status(401).send({
      status: "failure",
      message: "You are not authenticated!",
    });
  }
  try {
    const token = await User.findOne(
      { jwtToken: refreshToken },
      { jwtToken: true }
    );
    if (!token) {
      return res.status(200).send({
        status: "failure",
        message: "Refresh token is not valid!",
      });
    }
    jwt.verify(
      refreshToken,
      "YOUR_SECRETKEY_REFRESHTOKEN",
      async (err, user) => {
        if (err) {
          return res.status(500).send({
            status: "failure",
            message: "token is not valid!",
          });
        }
        const newAccessToken = generateToken.generateAccessToken(user);
        const newRefreshToken = generateToken.generateRefreshToken(user);
        await User.updateOne(
          { jwtToken: refreshToken },
          { $set: { jwtToken: newRefreshToken } }
        );
        res.status(200).json({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });
      }
    );
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: e.message,
    });
  }
};



module.exports = {
  signup,
  login,
  logout,
  verify,
  refresh,
};
