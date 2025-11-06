import mongoose, { Schema } from "mongoose";

const meetingSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  meetingCode: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  token: {
    type: String,
  },
});

const meetingModel = mongoose.model("Meeting", meetingSchema);

export default meetingModel;
