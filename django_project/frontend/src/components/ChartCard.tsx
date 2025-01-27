import React, { useEffect, useState } from "react";
import { Card, CardBody, Text, Box, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Input, Select, VStack } from "@chakra-ui/react";
import { ResizableBox } from "react-resizable";
import Draggable from "react-draggable";
import LineChart from "./DashboardCharts/LineChart";
import BarChart from "./DashboardCharts/BarChart";
import PieChart from "./DashboardCharts/PieChart";
import { RenderResult } from "./DashboardCharts/CombinedCharts";
import { Analysis } from "../store/analysisSlice";

 
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
    }
    analysisResults: any[];
    
  };
  className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ config, className }) => {
  const [cardWidth, setCardWidth] = useState(500);
  const [cardHeight, setCardHeight] = useState(500);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [newWidth, setNewWidth] = useState(cardWidth);
  const [newHeight, setNewHeight] = useState(cardHeight);
  const [chartType, setChartType] = useState('defaultChartType');
  const [dashboardName, setDashboardName] = useState('defaultDashboardName');

  useEffect(() => {
    if (config?.config) {
      setChartType(config.config.chartType);
      setDashboardName(config.config.dashboardName);
    }
  }, [config]);

  // Check if config.chartType is "chart" or "map"
  const isChart = config.config.preference === "chart";


  const getChartComponent = () => {
    if (!isChart) {
      return (
        <Box textAlign="center" p={4}>
          <Text fontSize="xl" fontWeight="bold" color="black">
            Coming Soon
          </Text>
          <Text color={"black"}>The map feature is not available yet.</Text>
        </Box>
      );
    }
  
    try {
  
      // switch (chartType) {
      //   case "bar":
      //     return <BarChart inputData={data[0]} />;
      //   case "pie":
      //     return <PieChart inputData={data[0]} />;
      //   default:
      //     return <LineChart inputData={data[0]} />;
      // }
      return <RenderResult analysis={config.analysisResults[0].analysis_results as unknown as Analysis} />
    } catch (error) {
      console.error("Error processing data:", error);
  
      // Fallback card in case of invalid data
      return (
        <Box textAlign="center" p={4}>
          <Text fontSize="xl" fontWeight="bold" color="red.500">
            Data Processing Error
          </Text>
          <Text color="black">We couldn't process the data for this chart. Please check the data source or try again later.</Text>
        </Box>
      );
    }
  };
  

  const handleResize = (event: any, { size }: any) => {
    setCardWidth(size.width);
    setCardHeight(size.height);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([config.config.downloadData], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "chart-data.txt";
    document.body.appendChild(element);
    element.click();
  };

  const handleSettingsSave = () => {
    setCardWidth(newWidth);
    setCardHeight(newHeight);
    setSettingsOpen(false);
  };

  return (
    <Draggable>
      <div className={className}  style={{ overflow: "hidden" ,width: cardWidth+ 'px', height: cardHeight + 'px'}}>
        <ResizableBox
          width={cardWidth}
          height={cardHeight}
          minConstraints={[150, 150]}
          maxConstraints={[500, 500]}
          onResizeStop={handleResize}
          resizeHandles={["se", "s", "e"]}
        >
        
          <Card boxShadow="lg" borderRadius={8} borderWidth="1px" borderColor="gray.300"  style={{ width: "auto"}}>
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="xl" fontWeight="bold" color="black">
                  {dashboardName} {config.config.owner && "(Owner)"}
                </Text>
                {getChartComponent()}
                <Box display="flex" justifyContent="space-between" width="100%">
                  <Button
                    colorScheme="teal"
                    size="sm"
                    variant="outline"
                    onClick={() => setSettingsOpen(true)}
                  >
                    Settings
                  </Button>
                  <Button
                    onClick={handleDownload}
                    colorScheme="teal"
                    size="sm"
                    variant="outline"
                  >
                    Download
                  </Button>
                </Box>
              </VStack>
            </CardBody>
          </Card>
          
        </ResizableBox>
        

        {/* Settings Modal */}
        <Modal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)}>
          <ModalOverlay />
          <ModalContent bg="white" p={6}>
            <ModalHeader>Dashboard Settings</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Box width="100%">
                  <Text fontSize="sm" color={"black"}>Dashboard Name</Text>
                  <Input
                    value={dashboardName}
                    onChange={(e) => setDashboardName(e.target.value)}
                    placeholder="Enter dashboard name"
                  />
                </Box>
                <Box width="100%">
                  <Text fontSize="sm" color={"black"}>Width</Text>
                  <Input
                    type="number"
                    value={newWidth}
                    onChange={(e) => setNewWidth(Number(e.target.value))}
                    min={150}
                    max={500}
                  />
                </Box>
                <Box width="100%">
                  <Text fontSize="sm" color={"black"}>Height</Text>
                  <Input
                    type="number"
                    value={newHeight}
                    onChange={(e) => setNewHeight(Number(e.target.value))}
                    min={150}
                    max={500}
                  />
                </Box>
                <Box width="100%">
                  <Text fontSize="sm" color={"black"}>Chart Type</Text>
                  <Select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                  >
                    <option value="line">Line Chart</option>
                    <option value="bar">Bar Chart</option>
                    <option value="pie">Pie Chart</option>
                  </Select>
                </Box>
                <Button colorScheme="blue" onClick={handleSettingsSave} mt={4}>
                  Save Changes
                </Button>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
        </div>
    </Draggable>
  );
};

export default ChartCard;
