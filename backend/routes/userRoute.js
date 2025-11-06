import express from "express";
import {
  loginUser,
  registerUser,
  getUserHistory,
  addToHistory,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/login", loginUser);
userRouter.post("/register", registerUser);
userRouter.post("/add_to_activity", addToHistory);
userRouter.get("/get_all_activity", getUserHistory);

export default userRouter;
