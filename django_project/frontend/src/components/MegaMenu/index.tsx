import { Box, Text, Link, Flex } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { logoutUser, selectIsLoggedIn } from "../../store/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store";

type MenuItem = {
  label: string;
  to: string;
  onClick?: () => void;
};

type MegaMenuProps = {
  hoveredSection: string | null;
  isUserAvatarHovered: boolean;
};

export default function MegaMenu({ hoveredSection, isUserAvatarHovered }: MegaMenuProps) {
  const isAuthenticated = useSelector(selectIsLoggedIn);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const handleClick = () => {
    navigate('/about');
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  // Menu items based on hover
  const menuItems: Record<string, MenuItem[]> = {
    about: [
      { label: "Africa RangeWatch", to: "/about" },
      { label: "Conversation", to: "/about" },
      { label: "Learn More", to: "/about" },
    ],
    userAvatar: !isAuthenticated
      ? [{ label: "Login", to: "/login" }]
      : [
          { label: "Admin", to: "/profile" },
          { label: "Logout", to: "", onClick: handleLogout }
      ],
    resources: [
      { label: "ARW Documentation", to: "/resources" },
      { label: "Resources", to: "/resources" },
    ],
  };

  const handleNavigation = (to: string | undefined) => {
    if (to) {
      navigate(to);
    }
  };

  return (
    <Box
      position={"absolute"}
      top="auto"
      pt="12px"
      zIndex={99}
      left={{base: isUserAvatarHovered ? "80%" : undefined, md: isUserAvatarHovered? "94%" : undefined}}
    >
      <Box bg="whiteAlpha.900" boxShadow="xs" w="100%" p="20px" borderRadius="8px">
        <Flex gap="30px">
          {/* About Section */}
          {hoveredSection === "about" && (
            <Flex gap="16px" flexDirection="column" alignItems="start">
              <Text 
                color="black" 
                fontSize={{ base: "15px", sm: "18px" }} 
                fontWeight={700} 
                onClick={handleClick}
                cursor="pointer"
              >
                About
              </Text>
              <Flex gap="12px" flexDirection="column" alignItems="start">
                {menuItems.about.map((item) => (
                  <Box
                    key={item.label}
                    onClick={() => handleNavigation(item.to)}
                    cursor="pointer"
                    fontSize={{ base: "13px", sm: "medium" }}
                  >
                    <Text color="black" fontSize="16px" fontWeight={400}>
                      {item.label}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </Flex>
          )}

          {/* User Avatar Section */}
          {hoveredSection === "userAvatar" && (
            <Flex gap="16px" flexDirection="column" alignItems="start">
              <Text color="black" fontSize={{ base: "15px", sm: "18px" }} fontWeight={700}>
                User
              </Text>
              <Flex gap="12px" flexDirection="column" alignItems="start">
                {menuItems.userAvatar.map((item) => (
                  <Link as={RouterLink} to={item.to} key={item.label} fontSize={{ base: "13px", sm: "medium" }} onClick={item.onClick}>
                    <Text color="black" fontSize="16px" fontWeight={400}>{item.label}</Text>
                  </Link>
                ))}
              </Flex>
            </Flex>
          )}

          {/* Resources Section */}
          {hoveredSection === "resources" && (
            <Flex gap="16px" flexDirection="column" alignItems="start">
              <Text color="black" fontSize={{ base: "15px", sm: "18px" }} fontWeight={700}>
                Resources
              </Text>
              <Flex gap="12px" flexDirection="column" alignItems="start">
                {menuItems.resources.map((item) => (
                  <Box
                    key={item.label}
                    onClick={() => handleNavigation(item.to)}
                    cursor="pointer"
                    fontSize={{ base: "13px", sm: "medium" }}
                  >
                    <Text color="black" fontSize="16px" fontWeight={400}>
                      {item.label}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </Flex>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
