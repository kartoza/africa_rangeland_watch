import { colors, shadows, fonts } from "./foundations";
import { extendTheme } from "@chakra-ui/react";
import { Text, Heading, Button } from "./components";

const theme = extendTheme({
  breakpoints: {
    sm: "550px",
    md: "1050px",
    lg: "1440px",
  },
  colors,
  shadows,
  fonts,
  components: { Text, Heading, Button },
});

export default theme;
