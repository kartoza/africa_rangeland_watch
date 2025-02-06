import { useState, useEffect } from "react";
import { FiArrowRight, FiArrowLeft } from "react-icons/fi";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody,
  VStack, Box, Text, Input, Select, Button, HStack, List, ListItem, IconButton,
  useToast
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux"; 
import { fetchDashboards, resetDashboardUpdated, updateDashboard } from "../../store/dashboardSlice";
import { AppDispatch, RootState } from "../../store";
import { Analysis } from "../../store/analysisSlice";
import CONFIG from "../../config";
import React from "react";
import { fetchAnalysis } from "../../store/userAnalysisSlice";

interface DashboardSettingsProps {
  isSettingsOpen: boolean;
  setSettingsOpen: (isOpen: boolean) => void;
  setTriggerRefetch: (value: boolean) => void;
  dashboardAnalyses: Analysis[];
  dashboard: {  
    uuid?: string;
    title: string | null;
    created_by?: string | null;
    organisations?: string[];
    analysis_results?: Analysis[];
    config: null;
    privacy_type: "public" | "private" | "organisation" | "restricted"; 
  }; 
}

export const DashboardSettingsModal: React.FC<DashboardSettingsProps> = ({
  isSettingsOpen,
  setSettingsOpen,
  setTriggerRefetch,
  dashboard
}) => {
  const [dashboardName, setDashboardName] = useState(dashboard?.title || "");
  const [dashboardType, setDashboardType] = useState(dashboard?.config || "chart");
  const [selectedUserAnalysis, setSelectedUserAnalysis] = useState<Analysis | null>(null);
  const [selectedDashboardAnalysis, setSelectedDashboardAnalysis] = useState<Analysis | null>(null);
  const [privacyType, setPrivacyType] = useState(dashboard?.privacy_type);
  const [dashboardConfig, setDashboardConfig] = useState(dashboard?.config);
  const analysisData = useSelector((state: any) => state.userAnalysis.data);
  const [dashboardAnalyses, setDashboardAnalyses] = useState(dashboard?.analysis_results);
  const { dashboardUpdated, error } = useSelector((state: RootState) => state.dashboard);
  const toast = useToast();
  const dispatch = useDispatch<AppDispatch>();

  

  useEffect(() => {
    const fetchData = async () => {
      await dispatch(fetchAnalysis());
    };
    fetchData();
  }, [dispatch]);


  useEffect(() => {
    setDashboardName(dashboard?.title || "");
    setDashboardType(dashboard?.config || "chart");
    setPrivacyType(dashboard?.privacy_type);
    setDashboardAnalyses(dashboard?.analysis_results)
    if (dashboardUpdated) {
      dispatch(resetDashboardUpdated());
      toast({
        title: "Dashboard updated",
        description: "Your dashaboard settings have been updated.If changes dont reflect immediately please refresh the page.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
        containerStyle: {
          backgroundColor: "#00634b",
          color: "white",
        },
      });
      setTriggerRefetch(true);
    }
  }, [dashboard]);

  const handlePrivacyTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPrivacyType(event.target.value as "public" | "private" | "organisation" | "restricted");
  };

  const addToDashboard = () => {
  
    if (!selectedUserAnalysis) {
      console.log("No analysis selected.");
      return;
    }
  
    if (!dashboardAnalyses || !Array.isArray(dashboardAnalyses)) {
      console.error("dashboardAnalyses is not an array:", dashboardAnalyses);
      return;
    }
  
    if (dashboardAnalyses.some((a: { id: string }) => a.id === selectedUserAnalysis.id)) {
      console.log("Analysis already exists in dashboard.");
      return;
    }
  
    setDashboardAnalyses([...dashboardAnalyses, selectedUserAnalysis]);
    setSelectedUserAnalysis(null);
    console.log("Added successfully. Updated Dashboard Analyses:", dashboardAnalyses);
  };
  

  const removeFromDashboard = () => {
    if (selectedDashboardAnalysis) {
      setDashboardAnalyses(dashboardAnalyses.filter((a: { id: string; }) => a.id !== selectedDashboardAnalysis.id));
      setSelectedDashboardAnalysis(null);
    }

  };

  const handleSave = () => {
    const analysisResultIds = dashboardAnalyses?.map((analysis: any) => analysis.id) || [];

    console.log('data to submit ',{
      uuid: dashboard.uuid,
      title: dashboardName, 
      privacy_type: privacyType,
      analysis_results: analysisResultIds,
      config: { preference: dashboardType } 
    })

    dispatch(
      updateDashboard({
        uuid: dashboard.uuid,
        updates: {
          title: dashboardName, 
          privacy_type: privacyType,
          analysis_results: analysisResultIds,
          config: {
            dashboardName: dashboardName,
            preference: dashboardType,
          }
        }
      })
    )
    
    setSettingsOpen(false);
  };

  return (
    <Modal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)}>
      <ModalOverlay />
      <ModalContent bg="white" p={4} maxW="90vw" width="700px">
        <ModalHeader>Dashboard Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="m" color="black" fontWeight="bold" mb={2}>Dashboard Name</Text>
              <Input
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="Enter dashboard name"
              />
            </Box>

            <Box>
              <Text fontSize="m" color="black" fontWeight="bold" mb={2}>Dashboard Type</Text>
              <Select
                value={dashboardType}
                onChange={(e) => setDashboardType(e.target.value)}
              >
                <option value="chart">Chart</option>
                <option value="map">Map</option>
              </Select>
            </Box>

            <Text fontSize="m" color="black" fontWeight="bold" mb={2} mt={2}>Associate Analysis Results</Text>
            <HStack spacing={1} align="flex-start" justify="center">
                {/* Available Analysis Results */}
                <Box flex={1} border="1px solid gray" p={3} borderRadius="md" maxHeight="100px" overflowY="auto">
                    <Text fontWeight="bold" mb={2} color="black">Analysis Results</Text>
                    <List spacing={1}>
                        {analysisData?.map((analysis:any) => (
                        <ListItem
                            key={analysis.id}
                            p={2}
                            cursor="pointer"
                            _hover={{ bg: "gray.100" }}
                            bg={selectedUserAnalysis?.id === analysis.id ? "blue.100" : "white"}
                            onClick={() => setSelectedUserAnalysis(analysis)}
                        >
                            {analysis.id}
                        </ListItem>
                        ))}
                    </List>
                </Box>

                {/* Action Buttons with Reduced White Space */}
                <VStack spacing={0}>
                    <IconButton
                      icon={<FiArrowRight />}
                      colorScheme="blue"
                      onClick={addToDashboard}
                      isDisabled={!selectedUserAnalysis}
                      aria-label="Move to dashboard"
                      size="sm"
                    />
                    <IconButton
                      icon={<FiArrowLeft />}
                      colorScheme="red"
                      onClick={removeFromDashboard}
                      isDisabled={!selectedDashboardAnalysis}
                      aria-label="Remove from dashboard"
                      size="sm"
                    />
                </VStack>

                {/* Dashboard Analysis Results */}
                <Box flex={1} border="1px solid gray" p={3} borderRadius="md" maxHeight="100px" overflowY="auto">
                    <Text fontWeight="bold" mb={2} color="black">Dashboard Analysis Results</Text>
                    <List spacing={1}>
                        {dashboardAnalyses?.map((analysis: any) => (
                        <ListItem
                            key={analysis.id}
                            p={2}
                            cursor="pointer"
                            _hover={{ bg: "gray.100" }}
                            bg={selectedDashboardAnalysis?.id === analysis.id ? "red.100" : "white"}
                            onClick={() => setSelectedDashboardAnalysis(analysis)}
                        >
                            {analysis.id}
                        </ListItem>
                        ))}
                    </List>
                </Box>
            </HStack>

            {CONFIG.ENABLE_CHART_TYPE && (
              <Box>
                <Text fontSize="sm" color="black">Chart Type</Text>
                <Select value={dashboardType} onChange={(e) => setDashboardType(e.target.value)}>
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="pie">Pie Chart</option>
                </Select>
              </Box>
            )}

            <Box>
              <Text fontSize="m" color="black" fontWeight="bold" mb={2}>Privacy Type</Text>
              <Select value={privacyType} onChange={handlePrivacyTypeChange}>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="organisation">Organisation</option>
                <option value="restricted">Restricted</option>
              </Select>
            </Box>
          </VStack>
        </ModalBody>

        <Button
          backgroundColor="dark_green.800"
          _hover={{ backgroundColor: "light_green.400" }}
          color="white"
          borderRadius="5px"
          onClick={handleSave}
          mt={2}
          alignSelf="flex-end"
          mr={4}
        >
          Save Changes
        </Button>
      </ModalContent>
    </Modal>
  );
};
