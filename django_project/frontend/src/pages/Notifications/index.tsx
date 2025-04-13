import React, { useState, useEffect } from "react";
import Helmet from "react-helmet";
import { useNavigate, useSearchParams } from "react-router-dom";
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

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleTabChange = (index: number) => {
    const tabParam = ["all", "personal", "organization", "system"][index];
    navigate(`/notifications?tab=${tabParam}`);
    setSelectedTabIndex(index);
  };

  useEffect(() => {
    const tabMap = {
      all: 0,
      personal: 1,
      organization: 2,
      system: 3,
    } as const;
    
    type TabKey = keyof typeof tabMap;
    
    const tabParam = searchParams.get("tab");
    
    if (tabParam && tabParam in tabMap) {
      setSelectedTabIndex(tabMap[tabParam as TabKey]);
    }
  }, []);

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
              onChange={handleTabChange} // Directly update the index
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
                  <NotificationsTab category="all"/>
                </TabPanel>
                <TabPanel>
                  <NotificationsTab category="personal"/>
                </TabPanel>
                <TabPanel>
                  <NotificationsTab category="organisation"/>
                </TabPanel>
                <TabPanel>
                  <NotificationsTab category="system"/>
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
