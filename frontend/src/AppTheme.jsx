import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const AppTheme = ({ children, ...props }) => {
  const theme = createTheme({
    palette: {
      mode: props.mode || "light",
      primary: {
        main: "#1976d2",
      },
      secondary: {
        main: "#dc004e",
      },
    },
  });

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default AppTheme;
