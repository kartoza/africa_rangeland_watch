const baseStyle = {
    color: "white.a700",
    fontFamily: "Inter",
  };
  
  const sizes = {
    textxs: {
      fontSize: "13px",
      fontWeight: 400,
      fontStyle: "normal",
    },
    sm: {
      fontSize: "16px",
      fontWeight: 400,
      fontStyle: "normal",
    },
    md: {
      fontSize: "32px",
      fontWeight: 400,
      fontStyle: "normal",
    },
    base: {
      fontSize: "27px",
      fontWeight: 400,
      fontStyle: "normal",
    },
  };
  
  const defaultProps = {
    size: "textxs",
  };
  
  const Text = {
    baseStyle,
    sizes,
    defaultProps,
  };
  
  export default Text;