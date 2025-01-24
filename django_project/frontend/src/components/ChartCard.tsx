import React, { useState } from "react";
import { Card, CardBody, Text, Box, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Input, Select, VStack } from "@chakra-ui/react";
import { ResizableBox } from "react-resizable";
import Draggable from "react-draggable";
import LineChart from "./DashboardCharts/LineChart";
import BarChart from "./DashboardCharts/BarChart";
import PieChart from "./DashboardCharts/PieChart";


  function purifyApiData(apiData: any[]) {
    if (!Array.isArray(apiData)) {
      throw new Error("Input data should be an array.");
    }
  
    return apiData.map((item) => {
      const { analysis_results } = item;
  
      if (!analysis_results || !analysis_results.data || !analysis_results.results) {
        throw new Error("Invalid data structure.");
      }
  
      const {
        latitude,
        community,
        landscape,
        longitude,
        analysisType,
      } = analysis_results.data;
  
      const {
        id,
        type,
        columns,
        version,
        features,
      } = analysis_results.results;
  
      const purifiedFeatures = features.map((feature: { id: any; type: any; geometry: any; properties: any; }) => {
        const {
          id: featureId,
          type: featureType,
          geometry,
          properties,
        } = feature;
  
        return {
          id: featureId,
          type: featureType,
          geometry: geometry || {},
          properties: {
            EVI: parseFloat(properties.EVI.toFixed(2)),
            NDVI: parseFloat(properties.NDVI.toFixed(2)),
            Name: properties.Name,
            area: parseFloat(properties.area.toFixed(0)),
            "SOC kg/m2": parseFloat(properties["SOC kg/m2"].toFixed(2)),
          },
        };
      });
  
      return {
        data: {
          latitude,
          community,
          landscape,
          longitude,
          analysisType,
        },
        results: {
          id,
          type,
          columns: {
            EVI: columns.EVI,
            NDVI: columns.NDVI,
            Name: columns.Name,
            area: columns.area,
            "SOC kg/m2": columns["SOC kg/m2"],
          },
          version,
          features: purifiedFeatures,
        },
      };
    });
  }
  

 
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
  const [chartType, setChartType] = useState(config.config.chartType);
  const [dashboardName, setDashboardName] = useState(config.config.dashboardName);

  // Check if config.chartType is "chart" or "map"
  const isChart = config.config.preference === "chart";
  console.log('config ',config.config)


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

    // If chart type is defined, render corresponding chart component
    const data = purifyApiData(config.analysisResults);


    switch (chartType) {
      case "bar":
        return <BarChart inputData={data[0]} />;
      case "pie":
        return <PieChart inputData={data[0]} />;
      default:
        return <LineChart inputData={data[0]} />;
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
      <div className={className}>
        <ResizableBox
          width={cardWidth}
          height={cardHeight}
          minConstraints={[150, 150]}
          maxConstraints={[500, 500]}
          onResizeStop={handleResize}
          resizeHandles={["se", "s", "e"]}
        >
          <Card boxShadow="lg" borderRadius={8} borderWidth="1px" borderColor="gray.300">
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
                    <option value="lineChart">Line Chart</option>
                    <option value="barChart">Bar Chart</option>
                    <option value="pieChart">Pie Chart</option>
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
