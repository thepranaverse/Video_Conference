import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Snackbar } from "@mui/material";
import { AuthContext } from "../contexts/AuthContext";

const defaultTheme = createTheme();

function Auth() {
  const [username, setUsername] = React.useState(""); // FIXED: lowercase
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(0); // 0 = login, 1 = register
  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  const handleAuth = async () => {
    setError("");
    try {
      if (formState === 0) {
        await handleLogin(username, password); // FIXED: lowercase
      } else {
        const result = await handleRegister(name, username, password); // FIXED: lowercase
        setUsername(""); // FIXED: lowercase
        setName("");
        setPassword("");
        setMessage(result || "Registration successful! Please login.");
        setOpen(true);
        setFormState(0);
      }
    } catch (err) {
      console.error("Auth error:", err);
      let msg = "An error occurred";
      if (err?.response?.data?.message) msg = err.response.data.message;
      else if (err?.message === "Network Error")
        msg =
          "Cannot connect to server. Please make sure the backend is running.";
      else if (err?.message) msg = err.message;
      setError(msg);
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Grid
        container
        component="main"
        sx={{
          height: "100vh",
          background: "linear-gradient(120deg, #1e3c72 0%, #2a5298 100%)",
        }}
      >
        <CssBaseline />

        {/* LEFT SIDE (Static Background Image) */}
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1920&q=80)",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* RIGHT SIDE (Form Section) */}
        <Grid
          item
          xs={12}
          sm={8}
          md={5}
          component={Paper}
          elevation={6}
          square
          sx={{
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(12px)",
            borderLeft: "1px solid rgba(255,255,255,0.2)",
            color: "white",
          }}
        >
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar
              sx={{
                m: 1,
                bgcolor: "#00bcd4",
                boxShadow: "0 0 20px rgba(0,188,212,0.6)",
              }}
            >
              <LockOutlinedIcon />
            </Avatar>

            <Typography
              component="h1"
              variant="h5"
              sx={{
                color: "white",
                fontWeight: "bold",
                textShadow: "0 0 10px rgba(0,0,0,0.4)",
              }}
            >
              {formState === 0 ? "Sign In" : "Sign Up"}
            </Typography>

            {/* Toggle Buttons */}
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button
                variant={formState === 0 ? "contained" : "outlined"}
                onClick={() => setFormState(0)}
                sx={{
                  borderRadius: "8px",
                  color: formState === 0 ? "white" : "#00bcd4",
                  borderColor: "#00bcd4",
                  background:
                    formState === 0
                      ? "linear-gradient(90deg, #00bcd4, #2196f3)"
                      : "transparent",
                  "&:hover": {
                    borderColor: "#2196f3",
                    color: "#2196f3",
                    background:
                      formState === 0
                        ? "linear-gradient(90deg, #2196f3, #00bcd4)"
                        : "rgba(255,255,255,0.1)",
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                variant={formState === 1 ? "contained" : "outlined"}
                onClick={() => setFormState(1)}
                sx={{
                  borderRadius: "8px",
                  color: formState === 1 ? "white" : "#00bcd4",
                  borderColor: "#00bcd4",
                  background:
                    formState === 1
                      ? "linear-gradient(90deg, #00bcd4, #2196f3)"
                      : "transparent",
                  "&:hover": {
                    borderColor: "#2196f3",
                    color: "#2196f3",
                    background:
                      formState === 1
                        ? "linear-gradient(90deg, #2196f3, #00bcd4)"
                        : "rgba(255,255,255,0.1)",
                  },
                }}
              >
                Sign Up
              </Button>
            </Box>

            {/* Form Inputs */}
            <Box component="form" noValidate sx={{ mt: 1, width: "100%" }}>
              {formState === 1 && (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  name="name"
                  value={name}
                  autoFocus
                  onChange={(e) => setName(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "rgba(255,255,255,0.4)" },
                      "&:hover fieldset": { borderColor: "#00bcd4" },
                      "&.Mui-focused fieldset": {
                        borderColor: "#00bcd4",
                        boxShadow: "0 0 10px rgba(0,188,212,0.5)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "rgba(255,255,255,0.7)",
                    },
                    "& .MuiInputBase-input": { color: "white" },
                  }}
                />
              )}

              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "rgba(255,255,255,0.4)" },
                    "&:hover fieldset": { borderColor: "#00bcd4" },
                    "&.Mui-focused fieldset": {
                      borderColor: "#00bcd4",
                      boxShadow: "0 0 10px rgba(0,188,212,0.5)",
                    },
                  },
                  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
                  "& .MuiInputBase-input": { color: "white" },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "rgba(255,255,255,0.4)" },
                    "&:hover fieldset": { borderColor: "#00bcd4" },
                    "&.Mui-focused fieldset": {
                      borderColor: "#00bcd4",
                      boxShadow: "0 0 10px rgba(0,188,212,0.5)",
                    },
                  },
                  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
                  "& .MuiInputBase-input": { color: "white" },
                }}
              />

              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}

              <Button
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.3,
                  fontSize: "1rem",
                  borderRadius: "10px",
                  background: "linear-gradient(90deg, #00bcd4, #2196f3)",
                  boxShadow: "0px 4px 20px rgba(33,150,243,0.4)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background: "linear-gradient(90deg, #2196f3, #00bcd4)",
                    boxShadow: "0px 4px 25px rgba(0,188,212,0.6)",
                    transform: "translateY(-2px)",
                  },
                }}
                onClick={handleAuth}
              >
                {formState === 0 ? "Login" : "Register"}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Snackbar for success messages */}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        message={message}
        onClose={() => setOpen(false)}
      />
    </ThemeProvider>
  );
}

export default Auth;
