import React, { createContext, useState } from "react";
import axios from "axios";
import httpStatus from "http-status";
import { useNavigate } from "react-router-dom";
import server from "../env.js";

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: `${server}/api/users`,
});

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const router = useNavigate();

  const handleRegister = async (name, username, password) => {
    try {
      console.log("Sending registration request with:", {
        name,
        username, 
      });

      const request = await client.post("/register", {
        name: name,
        username: username, 
        password: password,
      });

      console.log("Registration response:", request.data);

      if (request.status === httpStatus.CREATED || request.status === 201) {
        return request.data.message || "User Registered Successfully!";
      }

      return request.data.message || "Registration successful!";
    } catch (err) {
      console.error("Registration error:", err);
      console.error("Error response:", err.response?.data);

      if (err.response) {
        throw err;
      } else if (err.request) {
        throw {
          response: {
            data: {
              message:
                "Cannot connect to server. Please check if backend is running.",
            },
          },
        };
      } else {
        throw {
          response: {
            data: {
              message: "An unexpected error occurred: " + err.message,
            },
          },
        };
      }
    }
  };

  const handleLogin = async (username, password) => {
    try {
      console.log("Sending login request with:", { username }); 

      const request = await client.post("/login", {
        username: username, 
        password: password,
      });

      console.log("Login response:", request.data);

      if (request.status === httpStatus.OK || request.status === 200) {
        localStorage.setItem("token", request.data.token);
        setUserData(request.data);
        router("/home");
      }
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error response:", err.response?.data);
      throw err;
    }
  };

  const getHistoryOfUser = async () => {
    try {
      const request = await client.get("/get_all_activity", {
        params: {
          token: localStorage.getItem("token"),
        },
      });
      console.log(request.data);
      return request.data;
    } catch (err) {
      throw err;
    }
  };

  const addToUserHistory = async (meetingCode) => {
    console.log("Sending to backend:", meetingCode); 
    try {
      const request = await client.post("/add_to_activity", {
        token: localStorage.getItem("token"),
        meeting_code: meetingCode,
      });
      return request;
    } catch (e) {
      throw e;
    }
  };

  const data = {
    userData,
    setUserData,
    addToUserHistory,
    getHistoryOfUser,
    handleRegister,
    handleLogin,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
