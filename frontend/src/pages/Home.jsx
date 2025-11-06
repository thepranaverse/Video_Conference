import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import logo3 from "../assets/logo3.png";

export default function Home() {
  const [meetingCode, setMeetingCode] = useState("");
  const routeTo = useNavigate();

  const handleJoin = () => {
    if (meetingCode.trim() === "") {
      alert("Please enter a meeting code!");
      return;
    }
    routeTo(`/${meetingCode}`); // Redirect to /<meetingCode>
  };

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
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                type="text"
                placeholder="Meeting Code"
                className="meetingInput"
              />
              <button className="joinBtn" onClick={handleJoin}>
                Join
              </button>
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
