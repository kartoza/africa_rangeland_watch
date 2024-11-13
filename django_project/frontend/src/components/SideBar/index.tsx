import {
  ChakraProps,
  Box,
  useDisclosure,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from "@chakra-ui/react";
import React from "react";
import { MenuItem, Menu } from "react-pro-sidebar";
import { HamburgerIcon } from "@chakra-ui/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from '../../store';
import { logoutUser } from '../../store/authSlice';

interface Props extends ChakraProps {
  className?: string;
}

export default function Sidebar(props: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = () => {
        dispatch(logoutUser());
        onClose();
        navigate('/');
    };

  return (
    <>
      {/* Sidebar for desktop */}
      <Box
        {...props}
        width="286px !important"
        pt={{ md: "58px", base: "16px", sm: "20px" }}
        flexDirection="column"
        display={{ md: "flex", base: "none" }}
        bg="dark_green.800"
        h={{base:"auto" ,md:"100vh"}}
        top="0px"
        overflow="auto"
        sx={{ position: "sticky !important" }}
      >
        <Box
          menuItemStyles={{
            button: {
              padding: "12px 12px 12px 28px",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "16px",
              "&:hover, &.ps-active": {
                backgroundColor: "#a8d159 !important",
              },
            },
          }}
          as={Menu}
          alignSelf="stretch"
          display="flex"
          flexDirection="column"
          w="100%"
          justifyContent="space-between"
        >
          <MenuItem
            style={{ backgroundColor: isActive('/profile') ? '#a8d159' : 'transparent' }}
            onClick={() => navigate('/profile')}
          >
            Profile
          </MenuItem>
          <MenuItem
            style={{ backgroundColor: isActive('/organisation') ? '#a8d159' : 'transparent' }}
            onClick={() => navigate('/organisation')}
          >
            Organisation Information
          </MenuItem>
          <MenuItem onClick={() => navigate('/dashboard')}>My Dashboard</MenuItem>
          <MenuItem onClick={() => navigate('/analysis-results')}>Analysis Results</MenuItem>
          <MenuItem
            style={{ backgroundColor: isActive('/uploaded-resources') ? '#a8d159' : 'transparent' }}
            onClick={() => navigate('/uploaded-resources')}
          >
            Uploaded Resources
          </MenuItem>
          <MenuItem onClick={() => navigate('/support')}>Support</MenuItem>
          <MenuItem onClick={() => navigate('/notifications')}>Notifications</MenuItem>
          <MenuItem onClick={() => navigate('/sign-out')}>Sign Out</MenuItem>
        </Box>
      </Box>

      {/* Sidebar strip for mobile */}
      <Box
        display={{ base: "flex", md: "none" }}
        width="10%"
        bg="dark_green.800"
        h="100vh"
        position="fixed"
        left="0"
        top="0"
        alignItems="center"
        justifyContent="center"
        zIndex="1"
      >
        <IconButton
          icon={<HamburgerIcon />}
          aria-label="Open Sidebar"
          onClick={onOpen}
          color="white"
          bg="transparent"
          _hover={{ bg: "transparent" }}
        />
      </Box>

      {/* Drawer for full mobile sidebar */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay>
          <DrawerContent bg="green.900">
            <DrawerCloseButton color="white" />
            <Box
              pt="58px"
              flexDirection="column"
              display="flex"
              bg="green.900"
              h="100vh"
              overflow="auto"
              justifyContent="space-between"
            >
              <Box
                menuItemStyles={{
                  button: {
                    padding: "12px 12px 12px 28px",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "16px",
                    "&:hover, &.ps-active": {
                      backgroundColor: "#a8d159 !important",
                    },
                  },
                }}
                as={Menu}
                display="flex"
                flexDirection="column"
                w="100%"
              >
                <MenuItem
                  style={{ backgroundColor: isActive('/profile') ? '#a8d159' : 'transparent' }}
                  onClick={() => {
                    navigate('/profile');
                    onClose();
                  }}
                >
                  Profile
                </MenuItem>
                <MenuItem
                  style={{ backgroundColor: isActive('/organisation') ? '#a8d159' : 'transparent' }}
                  onClick={() => {
                    navigate('/organisation');
                    onClose();
                  }}
                >
                  Organisation Information
                </MenuItem>
                <MenuItem onClick={() => { navigate('/dashboard'); onClose(); }}>My Dashboard</MenuItem>
                <MenuItem onClick={() => { navigate('/analysis-results'); onClose(); }}>Analysis Results</MenuItem>
                <MenuItem
                  style={{ backgroundColor: isActive('/uploaded-resources') ? '#a8d159' : 'transparent' }}
                  onClick={() => {
                    navigate('/uploaded-resources');
                    onClose();
                  }}
                >
                  Uploaded Resources
                </MenuItem>
                <MenuItem onClick={() => { navigate('/support'); onClose(); }}>Support</MenuItem>
                <MenuItem onClick={() => { navigate('/notifications'); onClose(); }}>Notifications</MenuItem>
                <MenuItem onClick={() => handleLogout()}>Sign Out</MenuItem>
              </Box>
            </Box>
          </DrawerContent>
        </DrawerOverlay>
      </Drawer>
    </>
  );
}
