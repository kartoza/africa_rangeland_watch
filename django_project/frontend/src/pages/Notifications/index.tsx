import React, { useState } from "react";
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
  const [selectedTabIndex, setSelectedTabIndex] = useState(0); // Default to "All"

  const handleSettingsClick = () => {
    setSelectedTabIndex(4); // Switch to "Settings" tab
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
              index={selectedTabIndex}
              onChange={setSelectedTabIndex} // Directly update the index
            >
              <TabList display="flex" alignItems="center">
                <Tab _selected={{ color: "white", bg: "dark_green.800" }}>All</Tab>
                <Tab _selected={{ color: "white", bg: "dark_green.800" }}>Personal</Tab>
                <Tab _selected={{ color: "white", bg: "dark_green.800" }}>Organisations</Tab>
                <Tab _selected={{ color: "white", bg: "dark_green.800" }}>System</Tab>
                <Tab _selected={{ color: "white", bg: "dark_green.800" }} onClick={handleSettingsClick}>
                  <FaCog /> {/* Gear icon */}
                </Tab>


               
              </TabList>

              <TabPanels>
                <TabPanel>
                  <NotificationsTab />
                </TabPanel>
                <TabPanel>
                  <Text fontSize="m" fontWeight="bold" color="gray.500">No data available for Personal notifications.</Text>
                </TabPanel>
                <TabPanel>
                  <Text fontSize="m" fontWeight="bold" color="gray.500">No data available for Organisations notifications.</Text>
                </TabPanel>
                <TabPanel>
                  <Text fontSize="m" fontWeight="bold" color="gray.500">No data available for System notifications.</Text>
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
