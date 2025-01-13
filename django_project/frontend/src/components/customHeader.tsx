import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  HStack,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Image,
  Text,
  useDisclosure,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";
import { ChevronDownIcon, HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import MegaMenu from "./MegaMenu";
import SignIn from "./SignIn";
import { AppDispatch, RootState } from "../store";
import { checkLoginStatus, logoutUser } from "../store/authSlice";

const Header = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(checkLoginStatus());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser());
    onClose();
    navigate("/");
  };

  const handleHoverEnter = (section: string) => {
    setHoveredSection(section);
  };

  const handleHoverLeave = () => {
    setHoveredSection(null);
  };

  const handleNavigation = (to: string | undefined) => {
    if (to) {
      navigate(to);
    }
  };

  return (
    <Box bg="dark_green.800" color="white" px={4}>
      <Flex h={16} alignItems="center" justifyContent="space-between">
        {/* Left: Logo */}
        <HStack>
          <Image
            src="static/images/main_logo.svg"
            alt="Logo"
            h="52px"
            w="auto"
            maxW="190px"
          />
        </HStack>

        {/* Center: Navigation Links */}
        <HStack
          as="nav"
          spacing={8}
          justifyContent="center"
          align="center"
          flex="1"
        >
          <Link
            href="#"
            _hover={{ textDecoration: "none", color: "gray.300" }}
          >
            MAP
          </Link>
          <Link
            onClick={() => handleNavigation("/dashboard")}
            _hover={{ textDecoration: "none", color: "gray.300" }}
            style={{
              textDecoration:
                location.pathname === "/dashboard" ? "underline" : "none",
              textDecorationColor: "white",
            }}
          >
            DASHBOARD
          </Link>
          <Link
            href="#"
            _hover={{ textDecoration: "none", color: "gray.300" }}
          >
            HELP
          </Link>

          <Menu>
            <MenuButton
              as={Link}
              _hover={{ textDecoration: "none", color: "gray.300" }}
              display="flex"
              alignItems="center"
              onMouseEnter={() => handleHoverEnter('about')}
              onMouseLeave={handleHoverLeave}
            >
              ABOUT <ChevronDownIcon ml={1} />
            </MenuButton>
            
          </Menu>

          <Menu>
            <MenuButton
              as={Link}
              _hover={{ textDecoration: "none", color: "gray.300" }}
              display="flex"
              alignItems="center"
              onMouseEnter={() => handleHoverEnter('resources')}
              onMouseLeave={handleHoverLeave}
            >
              RESOURCES <ChevronDownIcon ml={1} />
            </MenuButton>
            
          </Menu>
        </HStack>

        {/* Right: Icons */}
        <HStack spacing={4}>
          {token && (
            <>
              <Link href="#">
                <Image
                  src="static/images/search_icon.svg"
                  alt="search"
                  h="24px"
                  w="24px"
                />
              </Link>
              <Link href="#">
                <Image
                  src="static/images/notifications_icon.svg"
                  alt="Notif"
                  h="24px"
                  w="24px"
                />
              </Link>
            </>
          )}

          {token ? (
            <Link
              onMouseEnter={() => handleHoverEnter("userAvatar")}
              onMouseLeave={handleHoverLeave}
            >
              <Image
                src="static/images/logged_in_user_avatar.svg"
                alt="user"
                h="28px"
                w="28px"
              />
              {hoveredSection === "userAvatar" && (
                <MegaMenu
                  hoveredSection="userAvatar"
                  isUserAvatarHovered={true}
                />
              )}
            </Link>
          ) : (
            <Link onClick={onOpen}>
              <Image
                src="static/images/user_avatar_header_icon.svg"
                alt="user"
                h="24px"
              />
            </Link>
          )}

          <IconButton
            display={{ base: "flex", sm: "none" }}
            icon={isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label="Toggle Menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            bg="transparent"
            color="white"
          />
        </HStack>
      </Flex>

      {/* Dropdown Menu for Mobile */}
      {isMobileMenuOpen && (
                <Box
                    bg="dark_green.800"
                    w="80%"
                    borderRadius={'5px'}
                    py="16px"
                    display={{ base: "block", sm: "none" }}
                    position="fixed"
                    top="70px"
                    left="50%"
                    transform="translateX(-50%)"
                    zIndex={999}
                    boxShadow="0px 4px 12px rgba(0, 0, 0, 0.2)"
                >
                    <UnorderedList
                        styleType="none"
                        flexDirection="column"
                        alignItems="center"
                        textAlign="center"
                        gap="20px"
                        display="flex"
                        color="white"
                    >
                        <ListItem><Link href="#"><Text>MAP</Text></Link></ListItem>
                        <ListItem><Link href="/dashboard"><Text>DASHBOARD</Text></Link></ListItem>
                        <ListItem><Link href="#"><Text>HELP</Text></Link></ListItem>
                        <ListItem onMouseEnter={() => handleHoverEnter('about')} onMouseLeave={handleHoverLeave}>
                            <Flex gap="4px" alignItems="center" cursor="pointer">
                                <Text>ABOUT</Text>
                                <Image src="static/images/arrow_down.svg" alt="Dropdown Arrow" h="8px" w="16px" />
                            </Flex>
                            {hoveredSection === 'about' && <MegaMenu hoveredSection="about" isUserAvatarHovered={false} />}
                        </ListItem>
                        <ListItem onMouseEnter={() => handleHoverEnter('resources')} onMouseLeave={handleHoverLeave}>
                            <Flex gap="4px" alignItems="center" cursor="pointer">
                                <Text>RESOURCES</Text>
                                <Image src="static/images/arrow_down.svg" alt="Dropdown Arrow" h="8px" w="16px" />
                            </Flex>
                            {hoveredSection === 'resources' && <MegaMenu hoveredSection="resources" isUserAvatarHovered={false} />}
                        </ListItem>
                    </UnorderedList>
                </Box>
            )}

      {/* Sign-In Modal */}
      <SignIn isOpen={isOpen} onClose={onClose} />
    </Box>
  );
};

export default Header;
