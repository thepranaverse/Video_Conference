import React from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import logo3 from "../assets/logo3.png";

export default function Home() {
  const routeTo = useNavigate();

  return (
    <div className="homeContainer">
      {/* Navbar */}
      <div className="navBar">
        <h2
          className="logo"
          onClick={() => routeTo("/")}
          style={{ cursor: "pointer", userSelect: "none" }}
        >
          ZenMeet
        </h2>
        <div className="navButtons">
          <button className="navBtn" onClick={() => routeTo("/userHistory")}>
            History
          </button>
          <button className="logoutBtn" onClick={() => routeTo("/auth")}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="meetContainer">
        <div className="leftPanel">
          <div>
            <h3>A calm space to connect and collaborate.</h3>
            <div className="joinContainer">
              <input
                type="text"
                placeholder="Meeting Code"
                className="meetingInput"
              />
              <button className="joinBtn">Join</button>
            </div>
          </div>
        </div>

        <div className="rightPanel">
          <img src={logo3} alt="Meeting illustration" />
        </div>
      </div>
    </div>
  );
}
