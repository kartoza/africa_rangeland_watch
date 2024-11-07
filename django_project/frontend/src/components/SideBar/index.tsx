import { ChakraProps, Box, useDisclosure, IconButton, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton } from "@chakra-ui/react";
import React from "react";
import { MenuItem, Menu } from "react-pro-sidebar";
import { HamburgerIcon } from "@chakra-ui/icons";

interface Props extends ChakraProps {
  className?: string;
}

export default function Sidebar1(props: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      {/* Sidebar for desktop */}
      <Box
        {...props}
        width="286px !important"
        pt={{ md: "58px", base: "16px", sm: "20px" }}
        flexDirection="column"
        display={{ md: "flex", base: "none" }}
        bg="dark_green.800"  // Set solid dark green color
        h="100vh"
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
          justifyContent="space-between"  // Evenly spaces items within sidebar
        >
          <MenuItem>Profile</MenuItem>
          <MenuItem>Organisation Information</MenuItem>
          <MenuItem>My Dashboard</MenuItem>
          <MenuItem>Analysis Results</MenuItem>
          <MenuItem>Uploaded Resources</MenuItem>
          <MenuItem>Support</MenuItem>
          <MenuItem>Notifications</MenuItem>
          <MenuItem>Sign Out</MenuItem>
        </Box>
      </Box>

      {/* Drawer for mobile */}
      <IconButton
        icon={<HamburgerIcon />}
        aria-label="Open Sidebar"
        display={{ base: "flex", md: "none" }}
        position="fixed"
        top="1.5rem"  // Position below the header
        left="0.5rem"  
        onClick={onOpen}
      />

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
                <MenuItem onClick={onClose}>Profile</MenuItem>
                <MenuItem onClick={onClose}>Organisation Information</MenuItem>
                <MenuItem onClick={onClose}>My Dashboard</MenuItem>
                <MenuItem onClick={onClose}>Analysis Results</MenuItem>
                <MenuItem onClick={onClose}>Uploaded Resources</MenuItem>
                <MenuItem onClick={onClose}>Support</MenuItem>
                <MenuItem onClick={onClose}>Notifications</MenuItem>
                <MenuItem onClick={onClose}>Sign Out</MenuItem>
              </Box>
            </Box>
          </DrawerContent>
        </DrawerOverlay>
      </Drawer>
    </>
  );
}
