import { Box, Text, Link, Flex } from "@chakra-ui/react";
import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { logoutUser, selectIsLoggedIn, isAdmin } from "../../store/authSlice";
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

  const navToAdmin = () => {
    if (window.location.hash) {
      window.location.href = '/admin';
    } else {
      navigate('/admin');
    }
  };

  const userIsAdmin = useSelector(isAdmin);

  // Menu items based on hover
  const menuItems: Record<string, MenuItem[]> = {
    about: [
      { label: "Africa RangeWatch", to: "/about" },
      { label: "Conversation", to: "/about" },
      { label: "Learn More", to: "/learn-more" },
    ],
    userAvatar: !isAuthenticated
      ? []
      : [
          ...(userIsAdmin ? [{ label: "Admin", to: "", onClick: navToAdmin }] : []),
          { label: "Profile Area", to: "/profile" },
          { label: "Sign Out", to: "", onClick: handleLogout },
      ],
    resources: [
      { label: "ARW Documentation", to: "/resources" },
      { label: "Resources", to: "/resources" },
    ],
  };

  const handleNavigation = (to: string | undefined, onClick?: () => void) => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    }
  };

  const positionProps =
    hoveredSection === "userAvatar"
      ? { right: { base: 0, md: 0 } }
      : { left: { base: isUserAvatarHovered ? "80%" : undefined, md: isUserAvatarHovered ? "93.5%" : undefined } };

  const containerWidth = hoveredSection === "userAvatar" ? { base: "120px", md: "150px" } : "auto";

  return (
    <Box
      position="absolute"
      top="auto"
      pt="12px"
      zIndex={99}
      {...positionProps}
    >
      <Box bg="whiteAlpha.900" boxShadow="xs" p="20px" borderRadius="8px" w={containerWidth}>
        <Flex gap="30px">
          {/* About Section */}
          {hoveredSection === "about" && (
            <Flex gap="16px" flexDirection="column" alignItems="start">
              <Text color="black" fontSize={{ base: "15px", sm: "18px" }} fontWeight={700} onClick={handleClick} cursor="pointer">
                About
              </Text>
              <Flex gap="12px" flexDirection="column" alignItems="start">
                {menuItems.about.map((item) => (
                  <Box
                    key={item.label}
                    onClick={() => item.label !== "Conversation" && handleNavigation(item.to, item.onClick)}
                    cursor={item.label === "Conversation" ? "not-allowed" : "pointer"}
                    fontSize={{ base: "13px", sm: "medium" }}
                  >
                    <Text 
                      color={item.label === "Conversation" ? "gray.400" : "black"} 
                      fontSize="16px" 
                      fontWeight={400}
                    >
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
                  <Link
                    as={RouterLink}
                    to={item.to}
                    key={item.label}
                    fontSize={{ base: "13px", sm: "medium" }}
                    onClick={item.onClick}
                  >
                    <Text color="black" fontSize="16px" fontWeight={400}>
                      {item.label}
                    </Text>
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
                    onClick={() => item.label !== "ARW Documentation" && handleNavigation(item.to, item.onClick)}
                    cursor={item.label === "ARW Documentation" ? "not-allowed" : "pointer"}
                    fontSize={{ base: "13px", sm: "medium" }}
                  >
                    <Text 
                      color={item.label === "ARW Documentation" ? "gray.400" : "black"} 
                      fontSize="16px" 
                      fontWeight={400}
                    >
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
