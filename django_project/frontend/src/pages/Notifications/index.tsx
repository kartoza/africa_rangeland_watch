import React, { useState, useEffect } from "react";
import Helmet from "react-helmet";
import {
  Box,
  Heading,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  IconButton,
} from "@chakra-ui/react";
import { FaCog } from "react-icons/fa"; // Importing the gear icon
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import NotificationsTab from "./notificationsTab";
import "../../styles/index.css";
import SystemTab from "./systemTab";

export default function Notifications() {
  const [selectedTab, setSelectedTab] = useState("all");

  const handleSettingsClick = () => {
    // You can handle the settings button click here (e.g., open a modal or navigate to settings page)
    alert("Settings clicked");
  };

  return (
    <>
      <Helmet>
        <title>Notifications</title>
        <meta name="description" content="View and manage your notifications." />
      </Helmet>

      <Header />
      <Box bg="white" w="100%">
        <Flex direction={{ base: "column", md: "row" }} gap="30px" alignItems="start">
          {/* Sidebar */}
          <Sidebar display={{ base: "none", md: "flex" }} />

          {/* Main Content */}
          <Box
            flex="1"
            ml={{ base: "35px", md: "0px" }}
            mt={{ base: "15px", md: "20px" }}
            width={{ base: "85%", md: "auto" }}
            overflow={"auto"}
          >
            <Heading size="lg" mb={6} color="black">
              Notifications
            </Heading>

            {/* Tabs */}
            <Tabs
              variant="enclosed"
              isLazy
              onChange={(index) =>
                setSelectedTab(
                  index === 0
                    ? "all"
                    : index === 1
                    ? "personal"
                    : index === 2
                    ? "organisations"
                    : "system"
                )
              }
            >
              <TabList display="flex" alignItems="center">
                <Tab
                  _selected={{ color: "white", bg: "dark_green.800" }}
                  color={selectedTab === "all" ? "white" : "black"}
                  bg={selectedTab === "all" ? "dark_green.800" : "transparent"}
                >
                  All
                </Tab>
                <Tab
                  _selected={{ color: "white", bg: "dark_green.800" }}
                  color={selectedTab === "personal" ? "white" : "black"}
                  bg={selectedTab === "personal" ? "dark_green.800" : "transparent"}
                >
                  Personal
                </Tab>
                <Tab
                  _selected={{ color: "white", bg: "dark_green.800" }}
                  color={selectedTab === "organisations" ? "white" : "black"}
                  bg={selectedTab === "organisations" ? "dark_green.800" : "transparent"}
                >
                  Organisations
                </Tab>
                <Tab
                  _selected={{ color: "white", bg: "dark_green.800" }}
                  color={selectedTab === "system" ? "white" : "black"}
                  bg={selectedTab === "system" ? "dark_green.800" : "transparent"}
                >
                  System
                </Tab>

                {/* Gear Icon on the extreme right */}
                <IconButton
                  icon={<FaCog />}
                  aria-label="Settings"
                  onClick={handleSettingsClick}
                  size="lg"
                  variant="ghost"
                  colorScheme="green"
                  ml="auto" 
                />
              </TabList>

              <TabPanels>
                <TabPanel>
                  <NotificationsTab />
                </TabPanel>
                <TabPanel>
                  <Text>No data available for Personal notifications.</Text>
                </TabPanel>
                <TabPanel>
                  <Text>No data available for Organisations notifications.</Text>
                </TabPanel>
                <TabPanel>
                  <SystemTab />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </Flex>
      </Box>
    </>
  );
}
