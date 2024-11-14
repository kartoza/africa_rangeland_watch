import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Badge,
  Table,
  Checkbox,
  Flex,
  IconButton,
  Input,
  Select,
  Switch,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import "../../styles/index.css";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

export default function SystemTab() {
  const [thresholdValue, setThresholdValue] = useState(0.05);
  const [allNotifications, setAllNotifications] = useState<any[]>([]);
  const [personalNotifications, setPersonalNotifications] = useState<any[]>([]);
  const [organisationsNotifications, setOrganisationsNotifications] = useState<any[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<any[]>([]);

  // Dummy Data for all notifications
  useEffect(() => {
    const fetchNotificationsData = async () => {
      
      setAllNotifications([]);

      // You can also set other notifications as needed
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
      <Table variant="simple">
        <Thead bg="gray.100">
          <Tr>
            <Th>Indicators</Th>
            <Th>Alerts</Th>
            <Th>Alert Trigger</Th>
            <Th>Threshold Value</Th>
            <Th>Anomaly Detection Alert</Th>
            <Th>Email</Th>
            <Th>Platform</Th>
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
                    variant="ghost"
                    aria-label="Decrease threshold"
                  />
                  <Input
                    value={notification.threshold}
                    width="auto"
                    textAlign="center"
                  />
                  <IconButton
                    icon={<FaArrowRight />}
                    onClick={() => handleArrowChange("increase")}
                    size="sm"
                    variant="ghost"
                    aria-label="Increase threshold"
                  />
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
    </>
  );
}
