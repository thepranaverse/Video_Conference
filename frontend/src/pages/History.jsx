import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import HistoryIcon from "@mui/icons-material/History";
import { Button, IconButton } from "@mui/material";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch {
        // TODO: handle error (snackbar)
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #007bff, #0056b3)",
        padding: "20px",
        color: "#fff",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <IconButton
            sx={{
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "white",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.25)" },
              marginRight: "10px",
            }}
          >
            <HistoryIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Meeting History
          </Typography>
        </div>

        <Button
          variant="contained"
          onClick={() => routeTo("/home")}
          sx={{
            backgroundColor: "rgba(255,255,255,0.2)",
            color: "white",
            textTransform: "none",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" },
          }}
        >
          Home
        </Button>
      </div>

      {/* Meeting Cards */}
      {meetings.length > 0 ? (
        meetings.map((e, i) => (
          <Card
            key={i}
            sx={{
              mb: 2,
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              backgroundColor: "#ffffff",
              color: "#333",
            }}
          >
            <CardContent>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Meeting Code: {e.meetingCode}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Date: {formatDate(e.date)}
              </Typography>
            </CardContent>
          </Card>
        ))
      ) : (
        <Typography variant="body1">No meeting history available.</Typography>
      )}
    </div>
  );
}
