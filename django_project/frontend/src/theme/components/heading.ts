const baseStyle = {
    color: "whiteAlpha.700",
    fontFamily: "Inter",
};

const sizes = {
    headingxs: {
        fontSize: { md: "64px", base: "48px" },
        fontWeight: 700,
        fontStyle: "bold",
    },
};

const defaultProps = {
    size: "headingxs",
};

const Heading = {
    baseStyle,
    sizes,
    defaultProps,
};

export default Heading;