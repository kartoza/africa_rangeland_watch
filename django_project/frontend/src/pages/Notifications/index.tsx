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
  useToast,
} from "@chakra-ui/react";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import NotificationsTab from "./notificationsTab";
import "../../styles/index.css";
import SystemTab from "./systemTab";



export default function Notifications() {
  const [selectedTab, setSelectedTab] = useState("all");
  const toast = useToast();

  

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
            ml={{ base: "55px", md: "0px" }}
            mt={{ base: "0px", md: "20px" }}
            width={{ base: "80%", md: "auto" }}
            overflow={"auto"}
          >
            <Heading size="lg" mb={6} color="black">
              Notifications
            </Heading>

            {/* Tabs */}
            <Tabs
              variant="enclosed"
              isLazy
              onChange={(index) => setSelectedTab(index === 0 ? "all" : index === 1 ? "personal" : index === 2 ? "organisations" : "system")}
            >
              <TabList>
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
              </TabList>

              <TabPanels>
                <TabPanel>
                  <NotificationsTab />
                </TabPanel>
                <TabPanel>
                  {/* No Data Available for "Personal" Tab */}
                  <Text>No data available for Personal notifications.</Text>
                </TabPanel>
                <TabPanel>
                  {/* No Data Available for "Organisations" Tab */}
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
