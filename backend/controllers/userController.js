import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import httpStatus from "http-status";
import meetingModel from "../models/meetingModel.js";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// login route
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Please provide username and password",
      });
    }

    const user = await userModel.findOne({ username });

    console.log("User found:", user ? "YES" : "NO");
    if (user) {
      console.log("Found user:", { username: user.username, name: user.name });
    }

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "User not exists! Register yourself",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

    if (isMatch) {
      const token = createToken(user._id);
      user.token = token;
      await user.save();

      return res.json({
        success: true,
        message: `Welcome ${user.name}`,
        token,
      });
    } else {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ success: false, message: "Invalid Credentials" });
    }
  } catch (error) {
    console.log("Login error:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

const registerUser = async (req, res) => {
  try {
    const { username, name, password } = req.body;

    console.log("=== REGISTRATION DEBUG ===");
    console.log("Raw request body:", req.body);
    console.log("Registration data:", { username, name });

    if (!username || !name || !password) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Please provide name, username, and password",
      });
    }

    const isExist = await userModel.findOne({ username });

    console.log("User already exists:", isExist ? "YES" : "NO");

    if (isExist) {
      return res.status(httpStatus.CONFLICT).json({
        success: false,
        message: "User already exists",
      });
    }

    if (password.length < 8) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPwd = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      username,
      name,
      password: hashPwd,
    });

    const user = await newUser.save();
    console.log("User created successfully:", user.username);

    const token = createToken(user._id);
    res.status(httpStatus.CREATED).json({
      success: true,
      message: "User Registered Successfully!",
      token,
    });
  } catch (error) {
    console.log("Registration error:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserHistory = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await userModel.findOne({ token: token });
    const meeting = await meetingModel.find({ user_id: user.username });
    res.json(meeting);
  } catch (error) {
    console.log(error);
  }
};

const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;
  console.log("Add to history called:", { token, meeting_code });
  try {
    const user = await userModel.findOne({ token: token });
    console.log("User found:", user);
    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User not found" });
    }

    const newMeeting = new meetingModel({
      user_id: user.username,
      meetingCode: meeting_code,
    });
    await newMeeting.save();
    console.log("Meeting saved:", newMeeting); 
    res.status(httpStatus.CREATED).json({ message: "Added Code To History" });
  } catch (error) {}
};

export { loginUser, registerUser, getUserHistory, addToHistory };
