import React, { useEffect, useRef, useState } from "react";
import { Card, CardBody, Text, Box, IconButton, VStack, Flex, HStack, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Input, Select, Button } from "@chakra-ui/react";
import { FiDownload, FiSettings } from "react-icons/fi"; 
import { RenderResult } from "./DashboardCharts/CombinedCharts";
import { Analysis } from "../store/analysisSlice";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { InProgressBadge } from "./InProgressBadge";
import CONFIG from "../config";

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

  useEffect(() => {
    if (config?.config) {
      setIsChart(config.config.preference === "chart");
      setDashboardName(config.config.dashboardName);
    }
  }, [config]);

  const getChartComponent = () => {
    if (!isChart) {
      return (
        <Box textAlign="center">
          <Text fontSize="xl" fontWeight="bold" color="black">Coming Soon</Text>
          <Text color="black">The map feature is not available yet.</Text>
        </Box>
      );
    }
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

  const downloadPDF = async () => {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save(`${dashboardName}_chart.pdf`);
  };

  return (
    <div ref={containerRef} className={className} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <Card width="100%" height="100%" position="relative" bg="gray.200">
        <CardBody p={0} m={0} width="100%" height="100%" display="flex" flexDirection="column">
          <VStack spacing={2} width="100%" height="100%" align="stretch">
            {/* Header with Name and Icons */}
            <Flex width="100%" align="center" justify="space-between" p={2}>
              <Text fontSize="xl" fontWeight="bold" color="black">
                {dashboardName} {config.config.owner && "(Owner)"}
              </Text>
              <HStack spacing={2}>
                <IconButton icon={<FiSettings />} colorScheme="teal" aria-label="Settings" size="sm" />
                <IconButton icon={<FiDownload />} onClick={downloadPDF} colorScheme="teal" aria-label="Download" size="sm" />
              </HStack>
            </Flex>

            {/* Chart Component */}
            <Box width="100%" height="100%">
              {getChartComponent()}
            </Box>
          </VStack>
        </CardBody>
      </Card>

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
