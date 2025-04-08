import React, { useEffect, useState } from "react";
import {
  Table, Thead, Tbody, Tr, Th, Td, Switch, Select, Input, Checkbox, Button, Spinner, Box, Text, useToast
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { formatDistanceToNow } from "date-fns";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { fetchIndicators, updateAlertSetting, updateAlertSettingAPI } from "../../store/indicatorSlice";
import { debounce } from "lodash";

export default function SystemTab() {
  const dispatch: AppDispatch = useDispatch();
  const { indicators, loading, error } = useSelector((state: RootState) => state.indicators);
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: number]: boolean }>({});
  const [isUpdating, setIsUpdating] = useState(false); // State for loader overlay
  const toast = useToast(); // For showing notifications

  useEffect(() => {
    dispatch(fetchIndicators());
  }, [dispatch]);

  const toggleDropdown = (indicatorId: number) => {
    setOpenDropdowns(prev => ({ ...prev, [indicatorId]: !prev[indicatorId] }));
  };

  // Handle updating alert settings
  const handleUpdateAlertSetting = async (indicatorId: number, alertSettingId: number, field: string, value: any) => {
    if (field === "threshold_value" && (value === "" || isNaN(value))) {
      value = 0;
    }

    // Set loader state to true while updating
    setIsUpdating(true);

    try {
      // Update the Redux state optimistically
      dispatch(updateAlertSetting({ indicatorId, alertSettingId, updates: { [field]: value } }));

      // Make API call to update
      await dispatch(updateAlertSettingAPI({
        indicatorId,
        alertSettingId,
        updates: { [field]: value },
      }));

      // Show success notification
      toast({
        title: "Alert Setting Updated",
        description: "The alert setting was successfully updated.",
        status: "success",
        position: "top-right",
        duration: 3000,
        isClosable: true,
        containerStyle: {
          backgroundColor: "#00634b",
          color: "white",
        },
      });
    } catch (error) {
      console.error("Error updating alert setting:", error);
      toast({
        title: "Error",
        description: "There was an issue updating the alert setting.",
        status: "error",
        position: "top-right",
        duration: 3000,
        isClosable: true,
        containerStyle: {
          backgroundColor: "#00634b",
          color: "white",
        },
      });
    } finally {
      // Hide loader once the update is finished
      setIsUpdating(false);
    }
  };

  const debouncedUpdateAlertSetting = debounce(handleUpdateAlertSetting, 500);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <Box position="relative">
      {/* Overlay with loader while updating */}
      {isUpdating && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.5)"
          display="flex"
          justifyContent="center"
          alignItems="center"
          zIndex={999}
        >
          <Spinner size="xl" color="green.500" />
        </Box>
      )}

      <Table variant="simple">
        <Thead bg="gray.100">
          <Tr>
            <Th>Indicators</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {indicators.map((indicator) => (
            <React.Fragment key={indicator.id}>
              <Tr>
                <Td>{indicator.name}</Td>
                <Td>
                  <Button
                    colorScheme="green"
                    variant="solid"
                    backgroundColor="dark_green.800"
                    _hover={{ backgroundColor: "light_green.400" }}
                    fontWeight={700}
                    w={{ base: "100%", md: "auto" }}
                    h={10}
                    color="white"
                    borderRadius="5px"
                    transition="all 0.3s ease-in-out"
                    onClick={() => toggleDropdown(indicator.id)}
                    rightIcon={<ChevronDownIcon />}
                  >
                    {openDropdowns[indicator.id] ? "Hide Alert Settings" : "View Alert Settings"}
                  </Button>
                </Td>
              </Tr>

              {openDropdowns[indicator.id] && (
                <Tr bg="gray.50">
                  <Td colSpan={2}>
                    <Table variant="simple" size="sm">
                      <Thead bg="gray.200">
                        <Tr>
                          <Th>Alert Name</Th>
                          <Th>Enable Alerting</Th>
                          <Th>Alert Trigger</Th>
                          <Th>Threshold Value</Th>
                          <Th>Anomaly Detection Alert</Th>
                          <Th>Email Alert</Th>
                          <Th>In-App Alert</Th>
                          <Th>Last Triggered</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {indicator.alert_settings.map((alertSetting) => (
                          <Tr key={alertSetting.id}>
                            <Td>{alertSetting.name}</Td>
                            <Td>
                              <Switch
                                colorScheme="green"
                                size="lg"
                                isChecked={alertSetting.enable_alert}
                                onChange={(e) => handleUpdateAlertSetting(indicator.id, alertSetting.id, "enable_alert", e.target.checked)}
                              />
                            </Td>
                            <Td>
                              <Select
                                defaultValue={alertSetting.threshold_comparison}
                                onChange={(e) => handleUpdateAlertSetting(indicator.id, alertSetting.id, "threshold_comparison", parseFloat(e.target.value))}
                                border="1px solid gray"
                              >
                                <option value={1}>Less Than</option>
                                <option value={2}>Greater Than</option>
                                <option value={3}>Equal To</option>
                              </Select>
                            </Td>
                            <Td>
                              <Input
                                type="number"
                                value={alertSetting.threshold_value}
                                onChange={(e) => debouncedUpdateAlertSetting(indicator.id, alertSetting.id, "threshold_value", e.target.value)}
                                border="1px solid gray"
                              />
                            </Td>
                            <Td>
                              <Switch
                                colorScheme="green"
                                size="lg"
                                isChecked={alertSetting.anomaly_detection_alert}
                                onChange={(e) => handleUpdateAlertSetting(indicator.id, alertSetting.id, "anomaly_detection_alert", e.target.checked)}
                              />
                            </Td>
                            <Td>
                              <Checkbox
                                colorScheme="green"
                                isChecked={alertSetting.email_alert}
                                onChange={(e) => handleUpdateAlertSetting(indicator.id, alertSetting.id, "email_alert", e.target.checked)}
                              />
                            </Td>
                            <Td>
                              <Checkbox
                                colorScheme="green"
                                isChecked={alertSetting.in_app_alert}
                                onChange={(e) => handleUpdateAlertSetting(indicator.id, alertSetting.id, "in_app_alert", e.target.checked)}
                              />
                            </Td>
                            <Td>
                              {alertSetting.last_alert
                                ? `${formatDistanceToNow(new Date(alertSetting.last_alert))} ago`
                                : "N/A"}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Td>
                </Tr>
              )}
            </React.Fragment>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
