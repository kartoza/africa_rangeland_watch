import {
    Modal,
    ModalContent,
    ModalOverlay,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Flex,
    Input,
    FormLabel,
    FormControl,
    RadioGroup,
    Radio,
    Stack,
    Select,
    useBreakpointValue,
  } from "@chakra-ui/react";
  import React, { useEffect, useState } from "react";
  import { useSelector, useDispatch } from 'react-redux';
  import { createDashboard, DashboardData } from "../store/dashboardSlice";
import { AppDispatch, RootState } from "../store";


  
  interface CreateDashboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    selectedAnalysis: any;
  }
  
  type PrivacyType = "organisation" | "public" | "private" | "restricted";

  const CreateDashboardModal: React.FC<CreateDashboardModalProps> = ({ isOpen, onClose, onSave, selectedAnalysis }) => {
    const [dashboardName, setDashboardName] = useState("");
    const [preference, setPreference] = useState("map");
    const [chartType, setChartType] = useState("");
    const [accessLevel, setAccessLevel] = useState<PrivacyType>("private");
    const dispatch = useDispatch<AppDispatch>();
    const [selectedOrganisation, setSelectedOrganisation] = useState("");
    const [organisations, setOrganisations] = useState<string[]>([]);

    const { profile } = useSelector((state: RootState) => state.userProfile);

    useEffect(() => {
        // Populate organisations when the profile is loaded
        if (profile && profile.organisations) {
            setOrganisations(profile.organisations);
            console.log(profile.organisations)
        }
    }, [profile]);
  
    const handleSave = () => {
      console.log({
        dashboardName,
        preference,
        chartType: preference === "chart" ? chartType : null,
        accessLevel,
      });
      onClose();
    };

    const handleCreateDashboard = () => {
        console.log({
            dashboardName,
            preference,
            chartType: preference === "chart" ? chartType : null,
            accessLevel,
            selectedOrganisation,
            selectedAnalysis
          });
        const newDashboard: DashboardData = {
            title: "My Dashboard",
            config: {
              dashboardName: dashboardName,
              preference: preference,
              chartType: preference === "chart" ? chartType : null,
            },
            privacy_type: accessLevel,
            analysis_results: selectedAnalysis,
            organisations: [selectedOrganisation],
            // FOR ADMIN TODO
            groups: [],
            users: [],
          };
        
          dispatch(createDashboard(newDashboard));
      };
    
  
    return (
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent
          maxW={{ base: "90vw", md: "50vw" }}
          bg="white"
          p={5}
        >
          <ModalHeader>Create Dashboard</ModalHeader>
          <ModalBody>
            {/* Dashboard Name */}
            <FormControl mb={4}>
              <FormLabel htmlFor="dashboardName" fontWeight="bold">
                Dashboard Name
              </FormLabel>
              <Input
                id="dashboardName"
                placeholder="Enter Dashboard Name"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                borderRadius="md"
                borderWidth="1px"
                borderColor="gray.500"
              />
            </FormControl>
  
            {/* Preferences */}
            <FormControl mb={4}>
              <FormLabel fontWeight="bold">Preferences</FormLabel>
              <RadioGroup
                onChange={(value) => setPreference(value)}
                value={preference}
              >
                <Stack direction="row" spacing={5}>
                  <Radio value="chart">Chart</Radio>
                  <Radio value="map">Map</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
  
            {/* Chart Options (Visible only if 'Chart' is selected) */}
            {preference === "chart" && (
              <FormControl mb={4}>
                <FormLabel fontWeight="bold">Chart Type</FormLabel>
                <Select
                  placeholder="Select Chart Type"
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Graph</option>
                  <option value="pie">Pie Chart</option>
                </Select>
              </FormControl>
            )}
  
            {/* Access Level */}
            <FormControl mb={4}>
              <FormLabel fontWeight="bold">Access Level</FormLabel>
              <Select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as PrivacyType)}
                >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="organisation">Organisation</option>
                <option value="restricted">Restricted</option>
               </Select>
            </FormControl>

            {/* Organisation Selector (Visible only if 'organisation' is selected) */}
            {accessLevel === "organisation" && (
                <FormControl mb={4}>
                <FormLabel fontWeight="bold">Select Organisation</FormLabel>
                <Select
                    placeholder="Select Organisation"
                    value={selectedOrganisation}
                    onChange={(e) => setSelectedOrganisation(e.target.value)}
                >
                    {organisations.map((org, index) => (
                    <option key={index} value={org}>
                        {org}
                    </option>
                    ))}
                </Select>
                </FormControl>
            )}

          </ModalBody>
  
          <ModalFooter>
            <Button
              colorScheme="green"
              variant="solid"
              backgroundColor="dark_green.800"
              _hover={{ backgroundColor: "light_green.400" }}
              color="white"
              width="auto"
              borderRadius="0px"
              h={10}
              onClick={handleCreateDashboard}
              isDisabled={!dashboardName || (preference === "chart" && !chartType)}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };
  
  export default CreateDashboardModal;
  