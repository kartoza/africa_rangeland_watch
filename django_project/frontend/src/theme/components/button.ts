import { defineStyle, defineStyleConfig } from "@chakra-ui/styled-system";

type ColorScheme = "dark_green_800" | "light_green_400" | "orange_a200" | "light_orange_400";

const baseStyle = defineStyle({
    borderRadius: "28px",
    outlineOffset: "0",
    cursor: "pointer",
    flexDirection: "row",
});

const sizes = {
    xs: defineStyle({
        h: "34px",
        fontSize: "12px",
        px: "8px",
    }),
    sm: defineStyle({
        h: "40px",
        fontSize: "14px",
        px: "12px",
    }),
    md: defineStyle({
        h: "48px",
        fontSize: "16px",
        px: "16px",
    }),
    lg: defineStyle({
        h: "56px",
        w: "220px",
        fontSize: "18px",
        px: "24px",
    }),
};

const colorCombinations: Record<ColorScheme, { bg: string; color: string; _hover: { bg: string } }> = {
    dark_green_800: {
        bg: "dark_green.800",
        color: "white.a700",
        _hover: { bg: "dark_green.700" },
    },
    light_green_400: {
        bg: "light_green.400",
        color: "white.a700",
        _hover: { bg: "light_green.300" },
    },
    orange_a200: {
        bg: "orange.a200",
        color: "white.a700",
        _hover: { bg: "orange.a300" },
    },
    light_orange_400: {
        bg: "light_orange.400",
        color: "white.a700",
        _hover: { bg: "orange.a200" },
    },
};

const variants = {
    fill: defineStyle((props) => {
        // Cast colorScheme to ColorScheme | undefined for type compatibility
        const colorScheme = props.colorScheme as ColorScheme | undefined;
        return colorCombinations[colorScheme || "orange_a200"];
    }),
};

const Button = defineStyleConfig({
    baseStyle,
    sizes,
    variants,
    defaultProps: {
        variant: "fill",
        size: "lg",
    },
});

export default Button;
