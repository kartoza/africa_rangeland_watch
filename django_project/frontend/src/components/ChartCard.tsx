import React, { useEffect, useRef, useState } from "react";
import { Card, CardBody, Text, Box, IconButton, VStack, Flex, HStack} from "@chakra-ui/react";
import { FiDownload, FiSettings, FiTrash2 } from "react-icons/fi"; 
import { RenderResult } from "./DashboardCharts/CombinedCharts";
import { Analysis } from "../store/analysisSlice";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import MiniMap from "./DashboardCharts/MapCard";
import { DashboardSettingsModal } from "./DashboardCharts/DashboardSettings";
import { deleteDashboard } from "../store/dashboardSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";

interface ChartCardProps {
  config: {
    privacy_type: any;
    owner: any;
    title: any;
    uuid: any;
    config?: {
      dashboardName: string;
      preference: string;
      chartType: string;
      title: string;
      data: any;
      downloadData: string;
      owner?: boolean;
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
  const [polygonCoordinates, setPolygonCoordinates] = useState<[number, number][]>([]);
  const [isRenderFailed, setIsRenderFailed] = useState(false);

  const [dashboardSettings, setDashboardSettings] = useState(null);
  const dispatch = useDispatch<AppDispatch>();
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);


  useEffect(() => {
    if (config?.config) {
      setIsChart(config.config.preference === "chart");
      setDashboardName(config.config.dashboardName);

      if(config.config.preference !== "chart"){
        
        if (config?.analysisResults?.[0]?.analysis_results?.results?.features) {
          setPolygonCoordinates(
            extractPolygonCoordinates(config.analysisResults[0].analysis_results.results.features)
          );
          setIsRenderFailed(false);
        }
        else setIsRenderFailed(true);
      }

      setDashboardSettings({
        uuid: config.uuid,
        title: config.title,
        created_by: config.owner,
        organisations: [],
        analysis_results: config.analysisResults, 
        config: config.config.preference,
        privacy_type: config.privacy_type
      });
        
    }

  }, [config]);

  

  const getChartComponent = () => {
    try {
      return <RenderResult analysisResults={config.analysisResults} />;
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

  // Extract polygon coordinates
  const extractPolygonCoordinates = (features: any[]) => {
    if (!Array.isArray(features)) {
      console.error("Invalid features array:", features);
      return [];
    }
  
    try {
      const polygonFeature = features.find(
        (feature) => feature?.geometry?.type === "Polygon"
      );
  
      return polygonFeature ? polygonFeature.geometry.coordinates[0] : [];
    } catch (e) {
      console.error("Error extracting polygon coordinates:", e.message);
      return [];
    }
  };
  

  const downloadPDF = async () => {
    if (!containerRef.current) return;
  
    // Hide the dashboard name and icons temporarily
    const dashboardNameElement = document.getElementById("dashboard-name");
    const iconsElement = document.getElementById("dashboard-icons");
  
    if (dashboardNameElement) dashboardNameElement.style.display = "none";
    if (iconsElement) iconsElement.style.display = "none";
  
    const canvas = await html2canvas(containerRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
  
    // Restore the hidden elements
    if (dashboardNameElement) dashboardNameElement.style.display = "block";
    if (iconsElement) iconsElement.style.display = "block";
  
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
    // Add title and description
    pdf.setFontSize(16);
    pdf.text("Analysis Results", 10, 20);
  
    pdf.setFontSize(12);
    pdf.text(`Saved on Dashboard: ${dashboardName}`, 10, 30);
  
    // Add the chart image below the text
    pdf.addImage(imgData, "PNG", 10, 40, imgWidth, imgHeight);
  
    pdf.save(`${dashboardName}_chart.pdf`);
  };

  const handleDeleteDashboard = (uuid: string) => {
      dispatch(deleteDashboard(uuid));
  };

  const handleOpenDeleteDialog = (dashboardId: string) => {
    setIsConfirmDeleteOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsConfirmDeleteOpen(false);
  };

  


  return (
    <div ref={containerRef} className={className} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
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
              {dashboardSettings?.created_by && (
                <IconButton 
                  icon={<FiSettings />} 
                  onClick={() => setSettingsOpen(true)} 
                  colorScheme="teal" 
                  aria-label="Settings" 
                  size="sm" 
                />
              )}
              <IconButton 
                icon={<FiDownload />} 
                onClick={downloadPDF} 
                colorScheme="teal" 
                aria-label="Download" 
                size="sm" 
              />
               {dashboardSettings?.created_by && (
                <IconButton 
                  icon={<FiTrash2 />} 
                  onClick={() => handleOpenDeleteDialog("dashboard-uuid")} 
                  colorScheme="red" 
                  aria-label="Delete Dashboard" 
                  size="sm" 
                />
              )}

              <ConfirmDeleteDialog 
                isOpen={isConfirmDeleteOpen}
                onClose={handleCloseDeleteDialog}
                onConfirm={() => handleDeleteDashboard(config?.uuid)}
                title="Delete Dashboard"
                description="Are you sure you want to delete this dashboard? This action cannot be undone."
              />
            </HStack>
          </Flex>

          {/* Chart Component */}
          <Box width="100%" height="100%">
            {isRenderFailed ? (
              <Text color="red.500" fontSize="sm">
                Analysis results saved on the dashboard cannot be rendered on the map. It should have polygon coordinates.
              </Text>
            ) : !isChart ? (
              <MiniMap polygonCoordinates={polygonCoordinates} />
            ) : (
              getChartComponent()
            )}
          </Box>
        </VStack>
      </CardBody>
      </Card>


       {/* Settings Modal */}
       <DashboardSettingsModal
          isSettingsOpen={isSettingsOpen}
          setSettingsOpen={setSettingsOpen}
          dashboardAnalyses={dashboardSettings?.analysis_results}
          dashboard={dashboardSettings}
        />
    </div>
  );
};

export default ChartCard;
