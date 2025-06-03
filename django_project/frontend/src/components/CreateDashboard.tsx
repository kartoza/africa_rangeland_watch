import {
    Modal,
    ModalContent,
    ModalOverlay,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    FormLabel,
    FormControl,
    Select,
    useToast,
  } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { createDashboard, DashboardData, clearDashboardCreated } from "../store/dashboardSlice";
import { AppDispatch, RootState } from "../store"


  
  interface CreateDashboardModalProps {
    isOpen: boolean;
    onClose: (dashboard_uuid: string) => void;
    selectedAnalysis: any;
  }
  
  type PrivacyType = "organisation" | "public" | "private" | "restricted";

  const CreateDashboardModal: React.FC<CreateDashboardModalProps> = ({ isOpen, onClose, selectedAnalysis }) => {
    const [dashboardName, setDashboardName] = useState("");
    const [preference, setPreference] = useState("chart");
    const [chartType, setChartType] = useState("");
    const [accessLevel, setAccessLevel] = useState<PrivacyType>("private");
    const dispatch = useDispatch<AppDispatch>();
    const [selectedOrganisation, setSelectedOrganisation] = useState("");
    const [organisations, setOrganisations] = useState<string[]>([]);
    const toast = useToast();

    const dashboardCreated = useSelector(
        (state: RootState) => state.dashboard.dashboardCreated
      );
    
      useEffect(() => {
        if (dashboardCreated) {
            toast({
                title: "Dashboard Created!",
                description: "Your dashboard has been created please head over to the dashboard page to view it.",
                status: "success",
                duration: 5000,
                isClosable: true,
                position: "top-right",
                containerStyle: {
                  backgroundColor: "#00634b",
                  color: "white",
                },
              });
              dispatch(clearDashboardCreated());
              onClose(dashboardCreated);
        }
      }, [dashboardCreated]);

    const { profile } = useSelector((state: RootState) => state.userProfile);

    useEffect(() => {
        if (profile && profile.organisations) {
            setOrganisations(profile.organisations);
        }
    }, [profile]);
  
   
    const handleCreateDashboard = () => {
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
      <Modal isOpen={isOpen} onClose={() => onClose(null)} isCentered>
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
              variant="outline"
              mr={3}
              onClick={() => onClose(null)}
              width="auto"
              borderRadius="0px"
              h={10}
              _hover={{ backgroundColor: "light_green.400" }}
            >
              Cancel
            </Button>
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
              isDisabled={!dashboardName}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };
  
  export default CreateDashboardModal;
  