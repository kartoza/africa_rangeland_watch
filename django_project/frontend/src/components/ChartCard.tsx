import React, { useEffect, useRef, useState } from "react";
import { Card, CardBody, Text, Box, IconButton, VStack, Flex, HStack, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Input, Select, Button} from "@chakra-ui/react";
import { FiDownload, FiSettings } from "react-icons/fi"; 
import { RenderResult } from "./DashboardCharts/CombinedCharts";
import { Analysis } from "../store/analysisSlice";
import { InProgressBadge } from "./InProgressBadge";
import CONFIG from "../config";
import MapCard from "./DashboardCharts/MapCard";
import { MapLibre } from "./Map/MapLibre";

interface ChartCardProps {
  config: {
    config: {
      dashboardName: string;
      preference: string;
      chartType: string;
      title: string;
      data: any;
      downloadData: string;
      owner: boolean;
    };
    analysisResults: any[];
  };
  className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ config, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isChart, setIsChart] = useState(false);
  const [dashboardName, setDashboardName] = useState("");
  const [isSettingsOpen, setSettingsOpen] = useState(false);
   const [chartType, setChartType] = useState("defaultChartType");
   const mapLibreRef = useRef(null);

  useEffect(() => {
    if (config?.config) {
      setIsChart(config.config.preference === "chart");
      setDashboardName(config.config.dashboardName);
    }
  }, [config]);

  const polygonCoordinates = [
    [
      [-122.420, 37.775], 
      [-122.418, 37.775], 
      [-122.418, 37.773], 
      [-122.420, 37.773], 
      [-122.420, 37.775]
    ]
  ]

  const getChartComponent = () => {
    try {
      return <RenderResult analysis={config.analysisResults[0].analysis_results as Analysis} />;
    } catch (error) {
      console.error("Error processing data:", error);
      return (
        <Box textAlign="center">
          <Text fontSize="xl" fontWeight="bold" color="red.500">Data Processing Error</Text>
          <Text color="black">We couldn't process the data for this chart.</Text>
        </Box>
      );
    }
  };
  

  return (
    <div ref={containerRef} className={className} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      {!isChart ? <MapLibre ref={mapLibreRef} /> : (
        <Card 
          width="100%" 
          height="100%"
          position="relative"
          bg="gray.200"
        >
          <CardBody p={0} m={0} width="100%" height="100%" display="flex" flexDirection="column">
            <VStack spacing={2} width="100%" height="100%" align="stretch">
              {/* Header with Name and Icons */}
              <Flex width="100%" align="center" justify="space-between" p={2}>
                <Text fontSize="xl" fontWeight="bold" color="black" id="dashboard-name">
                  {dashboardName} {config.config.owner && "(Owner)"}
                </Text>
                <HStack spacing={2} id="dashboard-icons">
                  <IconButton icon={<FiSettings />} onClick={() => setSettingsOpen(true)} colorScheme="teal" aria-label="Settings" size="sm" />
                  <IconButton icon={<FiDownload />} colorScheme="teal" aria-label="Download" size="sm" />
                </HStack>
              </Flex>

              {/* Chart Component */}
            
              <Box width="100%" height="100%">
                {getChartComponent()}
              </Box>
            </VStack>
          </CardBody>
        </Card>
       )}

       {/* Settings Modal */}
       <Modal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)}>
          <ModalOverlay />
          <ModalContent bg="white" p={6}>
            <ModalHeader>Dashboard Settings</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <InProgressBadge />
              <VStack spacing={4}>
                <Box width="100%">
                  <Text fontSize="sm" color="black">Dashboard Name</Text>
                  <Input value={dashboardName} onChange={(e) => setDashboardName(e.target.value)} placeholder="Enter dashboard name" />
                </Box>
                {CONFIG.ENABLE_CHART_TYPE && (
                  <Box width="100%">
                    <Text fontSize="sm" color="black">Chart Type</Text>
                    <Select value={chartType} onChange={(e) => setChartType(e.target.value)}>
                      <option value="line">Line Chart</option>
                      <option value="bar">Bar Chart</option>
                      <option value="pie">Pie Chart</option>
                    </Select>
                  </Box>
                )}
                <Button colorScheme="blue" onClick={() => setSettingsOpen(false)} mt={4}>Save Changes</Button>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
    </div>
  );
};

export default ChartCard;
