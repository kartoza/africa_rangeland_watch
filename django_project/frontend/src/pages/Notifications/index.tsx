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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Switch,
  Select,
  Input,
  Button,
  Checkbox,
  Text,
  useDisclosure,
  useToast,
  useBreakpointValue,
  IconButton,
} from "@chakra-ui/react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa"; // for the arrow icons
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import "../../styles/index.css";



export default function Notifications() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [thresholdValue, setThresholdValue] = useState(0.05);
  const [allNotifications, setAllNotifications] = useState<any[]>([]);
  const [personalNotifications, setPersonalNotifications] = useState<any[]>([]);
  const [organisationsNotifications, setOrganisationsNotifications] = useState<any[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<any[]>([]);
  const toast = useToast();

  useEffect(() => {
    // Simulating API calls for fetching data for each tab
    const fetchNotificationsData = async () => {
      // For "All" tab, we simulate fetching data
      setAllNotifications([]);

      // For other tabs, we simulate "No data available" scenario
      setPersonalNotifications([]);
      setOrganisationsNotifications([]);
      setSystemNotifications([]);
    };

    fetchNotificationsData();
  }, []);

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>, id: number, field: string) => {
    if (field === "alert") {
      const updatedData = allNotifications.map((item) =>
        item.id === id ? { ...item, alert: event.target.checked } : item
      );
      setAllNotifications(updatedData);
    } else if (field === "anomalyDetectionAlert") {
      const updatedData = allNotifications.map((item) =>
        item.id === id ? { ...item, anomalyDetectionAlert: event.target.checked } : item
      );
      setAllNotifications(updatedData);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, type: string, id: number) => {
    const updatedData = allNotifications.map((item) =>
      item.id === id
        ? {
            ...item,
            [type]: e.target.checked,
          }
        : item
    );
    setAllNotifications(updatedData);
  };

  const handleArrowChange = (direction: string) => {
    if (direction === "increase") {
      setThresholdValue((prev) => prev + 0.01);
    } else {
      setThresholdValue((prev) => prev - 0.01);
    }
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
                  {/* Table for "All" Tab */}
                  <Table variant="simple">
                    <Thead bg="gray.100">
                      <Tr>
                        <Th boxShadow="s">Indicators</Th>
                        <Th boxShadow="s">Alerts</Th>
                        <Th boxShadow="s">Alert Trigger</Th>
                        <Th boxShadow="s">Threshold Value</Th>
                        <Th boxShadow="s">Anomaly Detection Alert</Th>
                        <Th boxShadow="s">Email</Th>
                        <Th boxShadow="s">Platform</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {allNotifications.map((notification) => (
                        <Tr key={notification.id}>
                          <Td>{notification.indicator}</Td>
                          <Td>
                            <Switch
                              colorScheme="green"
                              size="lg"
                              isChecked={notification.alert}
                              onChange={(e) => handleToggleChange(e, notification.id, "alert")}
                              sx={{
                                "& .chakra-switch__track": {
                                backgroundColor: "gray.300",
                                _checked: {
                                    backgroundColor: "dark_green.800",
                                },
                                },
                                "& .chakra-switch__thumb": {
                                    backgroundColor: "white",
                                    _checked: {
                                        backgroundColor: "white",
                                    },
                                },
                                }}
                            />
                          </Td>
                          <Td>
                          <Select
                            placeholder="Select trigger"
                            defaultValue={notification.alertTrigger}
                            sx={{
                                backgroundColor: "gray.200", 
                                borderRadius: "8px",
                                padding: "8px",
                                _focus: {
                                borderColor: "#91e05e",
                                },
                            }}
                            >
                            <option value="lessThan">Less Than</option>
                            <option value="greaterThan">Greater Than</option>
                            <option value="equalTo">Equal To</option>
                            </Select>
                          </Td>
                          <Td>
                            <Flex alignItems="center">
                              <IconButton
                                          icon={<FaArrowLeft />}
                                          onClick={() => handleArrowChange("decrease")}
                                          size="sm"
                                          variant="ghost" aria-label={""}                              />
                              <Input
                                value={notification.threshold}
                                width="auto"
                                textAlign="center"
                              />
                              <IconButton
                                          icon={<FaArrowRight />}
                                          onClick={() => handleArrowChange("increase")}
                                          size="sm"
                                          variant="ghost" aria-label={""}                              />
                            </Flex>
                          </Td>
                          <Td>
                          <Switch
                            colorScheme="green"
                            size="lg"
                            isChecked={notification.anomalyDetectionAlert}
                            onChange={(e) => handleToggleChange(e, notification.id, "anomalyDetectionAlert")}
                            sx={{
                                "& .chakra-switch__track": {
                                backgroundColor: "gray.300",
                                _checked: {
                                    backgroundColor: "#91e05e",
                                },
                                },
                                "& .chakra-switch__thumb": {
                                backgroundColor: "white",
                                _checked: {
                                    backgroundColor: "white",
                                },
                                },
                            }}
                            />

                          </Td>
                          <Td>
                          <Checkbox
                            colorScheme="green"
                            borderRadius="full"
                            isChecked={notification.email}
                            onChange={(e) => handleCheckboxChange(e, "email", notification.id)}
                            size="lg"
                            sx={{
                                // Style for the checkbox control
                                "& .chakra-checkbox__control": {
                                backgroundColor: "transparent",
                                borderColor: "gray.400",
                                borderRadius: "50%",
                                width: "30px",
                                height: "30px",
                                },
                                "& .chakra-checkbox__control[data-checked='true']": {
                                backgroundColor: "#91e05e",
                                borderColor: "#91e05e",
                                },
                            }}
                            />

                          </Td>
                          <Td>
                          <Checkbox
                            colorScheme="green"
                            borderRadius="50%"
                            isChecked={notification.platform}
                            onChange={(e) => handleCheckboxChange(e, "platform", notification.id)}
                            size="lg" 
                            sx={{
                                // Style for the checkbox control
                                "& .chakra-checkbox__control": {
                                backgroundColor: "transparent",
                                borderColor: "gray.400",
                                borderRadius: "50%",
                                width: "30px",
                                height: "30px",
                                },
                                "& .chakra-checkbox__control[data-checked='true']": {
                                backgroundColor: "#91e05e",
                                borderColor: "#91e05e",
                                },
                            }}
                            />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
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
                  {/* No Data Available for "System" Tab */}
                  <Text>No data available for System notifications.</Text>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </Flex>
      </Box>
    </>
  );
}
