import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import Auth from "./pages/Auth.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import VideoMeet from "./pages/VideoMeet.jsx";
import Home from "./pages/Home.jsx";
import History from "./pages/History.jsx";
const App = () => {
  return (
    <div>
      <BrowserRouter>
        <AuthProvider>
          {" "}
          {/* because useNavigate is in router we have to use it  */}
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/userHistory" element={<History />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/:url" element={<VideoMeet />} /> {/* as we type anything we go to meeting page */}
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
};

export default App;
