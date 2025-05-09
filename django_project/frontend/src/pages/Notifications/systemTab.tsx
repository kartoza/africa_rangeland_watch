import React, { useEffect, useState } from "react";
import {
  Table, Thead, Tbody, Tr, Th, Td, Switch, Input, Checkbox, Button, Spinner, Box, Text, useToast,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  useDisclosure
} from "@chakra-ui/react";
import { Select  as DropSelect } from "@chakra-ui/react";
import AsyncSelect from "react-select/async";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { formatDistanceToNow } from "date-fns";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import {
  fetchIndicators,
  updateAlertSetting,
  updateAlertSettingAPI,
  createAlertSettingAPI,
} from "../../store/indicatorSlice";
import { debounce } from "lodash";

type LocationOption = {
  label: string;
  value: number;
};

export default function SystemTab() {
  const dispatch: AppDispatch = useDispatch();
  const { indicators, loading, error } = useSelector((state: RootState) => state.indicators);
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: number]: boolean }>({});
  const [isUpdating, setIsUpdating] = useState(false); // State for loader overlay
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedIndicator, setSelectedIndicator] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [newAlertData, setNewAlertData] = useState({
    name: "",
    threshold_value: 0,
    threshold_comparison: 1,
    email_alert: false,
    in_app_alert: false,
    anomaly_detection_alert: false,
    enable_alert: true,
  });
  const [locations, setLocations] = useState<
    { id: number; community_name: string; landscape_name: string }[]
  >([]);
  const loadLocationOptions = async (inputValue: string): Promise<LocationOption[]> => {
    try {
      const response = await fetch(`/api/landscape-communities/?search=${inputValue}`);
      const data = await response.json();
  
      const fetchedLocations = data.results || data;
  
      // Update local state for label rendering
      setLocations((prev) => {
        const existingIds = new Set(prev.map((l) => l.id));
        const newOnes = fetchedLocations.filter((l: any) => !existingIds.has(l.id));
        return [...prev, ...newOnes];
      });
  
      return fetchedLocations.map((loc: any) => ({
        label: `${loc.landscape_name} - ${loc.community_name}`,
        value: loc.id,
      }));
    } catch (error) {
      console.error("Error loading location options:", error);
      return [];
    }
  };
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
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="white" borderRadius="md" p={5} maxW="500px">
          <ModalHeader>Create New Alert Setting</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Alert Name"
              mb={3}
              value={newAlertData.name}
              onChange={(e) => setNewAlertData({ ...newAlertData, name: e.target.value })}
            />
            <Box mb={3}>
              <AsyncSelect
                cacheOptions
                loadOptions={loadLocationOptions}
                defaultOptions={false}
                onChange={(option: LocationOption | null) =>
                  setSelectedLocation(option?.value ?? null)
                }
                value={
                  selectedLocation
                    ? {
                        label:
                          locations.find((l) => l.id === selectedLocation)?.landscape_name +
                          " - " +
                          locations.find((l) => l.id === selectedLocation)?.community_name,
                        value: selectedLocation,
                      }
                    : null
                }
                placeholder="Search for a location..."
                isClearable
              />
            </Box>
            <DropSelect
              placeholder="Select Indicator"
              mb={3}
              value={selectedIndicator ?? ""}
              onChange={(e) => setSelectedIndicator(Number(e.target.value))}
            >
              {indicators.map((indicator) => (
                <option key={indicator.id} value={indicator.id}>
                  {indicator.name}
                </option>
              ))}
            </DropSelect>
            <DropSelect
              mb={3}
              value={newAlertData.threshold_comparison}
              onChange={(e) => setNewAlertData({ ...newAlertData, threshold_comparison: Number(e.target.value) })}
            >
              <option value={1}>Less Than</option>
              <option value={2}>Greater Than</option>
              <option value={3}>Equal To</option>
            </DropSelect>
            <Input
              placeholder="Threshold Value"
              type="number"
              mb={3}
              value={newAlertData.threshold_value}
              onChange={(e) => setNewAlertData({ ...newAlertData, threshold_value: parseFloat(e.target.value) })}
            />
            <Checkbox
              isChecked={newAlertData.email_alert}
              onChange={(e) => setNewAlertData({ ...newAlertData, email_alert: e.target.checked })}
              mb={2}
            >
              Email Alert
            </Checkbox>
            <Checkbox
              isChecked={newAlertData.in_app_alert}
              onChange={(e) => setNewAlertData({ ...newAlertData, in_app_alert: e.target.checked })}
              mb={2}
            >
              In-App Alert
            </Checkbox>
            <Checkbox
              isChecked={newAlertData.anomaly_detection_alert}
              onChange={(e) => setNewAlertData({ ...newAlertData, anomaly_detection_alert: e.target.checked })}
              mb={2}
            >
              Anomaly Detection
            </Checkbox>
            <Checkbox
              isChecked={newAlertData.enable_alert}
              onChange={(e) => setNewAlertData({ ...newAlertData, enable_alert: e.target.checked })}
              mb={2}
            >
              Enable Alert
            </Checkbox>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={async () => {
                if (!selectedIndicator) return;

                try {
                  setIsUpdating(true);
                  await dispatch(createAlertSettingAPI({
                    indicatorId: selectedIndicator,
                    updates: {
                      ...newAlertData,
                      indicator: selectedIndicator,
                      location: selectedLocation,
                    },
                  }));
                  dispatch(fetchIndicators()); // Refresh data
                  toast({
                    title: "Alert Created",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                  });
                  onClose();
                  setNewAlertData({
                    name: "",
                    threshold_value: 0,
                    threshold_comparison: 1,
                    email_alert: false,
                    in_app_alert: false,
                    anomaly_detection_alert: false,
                    enable_alert: true,
                  });
                } catch (err) {
                  toast({
                    title: "Error",
                    description: "Failed to create alert.",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                  });
                } finally {
                  setIsUpdating(false);
                }
              }}
            >
              Submit
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
        <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <Button
            colorScheme="green"
            backgroundColor="dark_green.800"
            _hover={{ backgroundColor: "light_green.400" }}
            fontWeight="bold"
            color="white"
            borderRadius="md"
            px={4}
            h={7}
            onClick={() => {
              setSelectedIndicator(null);
              onOpen();
            }}
          >
            Add Alert Setting
          </Button>
        </Box>

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
                                <DropSelect
                                  defaultValue={alertSetting.threshold_comparison}
                                  onChange={(e) => handleUpdateAlertSetting(indicator.id, alertSetting.id, "threshold_comparison", parseFloat(e.target.value))}
                                  border="1px solid gray"
                                >
                                  <option value={1}>Less Than</option>
                                  <option value={2}>Greater Than</option>
                                  <option value={3}>Equal To</option>
                                </DropSelect>
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
    </>
  );
}
