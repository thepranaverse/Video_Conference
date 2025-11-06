import React from "react";
import "../App.css";
import mobileImg from "../assets/mobile.png";
import { Link, useNavigate } from "react-router-dom";

const LandingPage = () => {
  const router = useNavigate();
  return (
    <div>
      <div className="landingPageContainer">
        <nav>
          <div className="navHeader">
            <h2>ZenMeet</h2>
          </div>
          <div className="navlist">
            <p
              className="joinGuest"
              onClick={() => {
                router("/$guest$");
              }}
            >
              Join as Guest
            </p>
            <p
              className="register"
              onClick={() => {
                router("/auth");
              }}
            >
              Register
            </p>
            <button
              onClick={() => {
                router("/auth");
              }}
            >
              Login
            </button>
          </div>
        </nav>

        <div className="landingMainContainer">
          <div>
            <h1>
              <span style={{ color: "#FF9839" }}>Connect</span> with your loved
              once!
            </h1>

            <p>Cover a distance with Us..</p>
            <div role="button">
              <Link to={"/auth"}>Get Started</Link>
            </div>
          </div>
          <div>
            <img src={mobileImg} alt="" />
          </div>
        </div>
      </div>
      ;
    </div>
  );
};

export default LandingPage;
