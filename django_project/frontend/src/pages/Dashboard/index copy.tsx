import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  Badge,
  SimpleGrid,
  Image,
  Heading,
  Checkbox,
  Select,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { FaFilter } from "react-icons/fa";
import Header from "../../components/Header";
import { Helmet } from "react-helmet";
import Footer from "../../components/Footer";
import AnalysisSideBar from "../../components/SideBar/AnalysisSideBar";
import Pagination from "../../components/Pagination";
import ChartCard from "../../components/ChartCard";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store";
import { fetchDashboards } from "../../store/dashboardSlice";
import {InProgressBadge} from "../../components/InProgressBadge";
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { DragHandleDots2Icon } from '@radix-ui/react-icons';
import DashboardFilters from "../../components/DashboardFilters";



const DashboardPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const itemsPerPage = 12; //these will be dynamic
  const totalItems = 12; //these will be dynamic
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const dispatch = useDispatch<AppDispatch>();
  const dashboardData = useSelector((state: any) => state.dashboard.dashboards);
  const loading = useSelector((state: any) => state.dashboard.loading);
  const error = useSelector((state: any) => state.dashboard.error);
  const [resourcesCount, setResourcesCount] = useState(0);
  const [chartsConfig, setChartsConfig] = useState([]);
  const [hasError, setHasError] = useState(false);


  useEffect(() => {
    if (!loading && Array.isArray(dashboardData)) {
      const updatedChartsConfig = dashboardData.map((dashboard) => ({
        config: dashboard.config,
        analysisResults: dashboard.analysis_results,
        title: dashboard.title,
        uuid: dashboard.uuid,
        owner: dashboard.owner,
      }));

      // Set the state to pass down to the chart cards
      setChartsConfig(updatedChartsConfig);
    }
  }, [loading, dashboardData]);

  useEffect(() => {
    dispatch(fetchDashboards());
  }, [dispatch]);

  useEffect(() => {
    if(!loading){
      setResourcesCount(Array.isArray(dashboardData)? dashboardData.length: 0)
    }
  }, [loading]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleFilterClick = () => {
    if (isOpen) {
      onClose();
    } else {
      onOpen();
    }
  };

  const handleViewClick = (analysis: any) => {
    setIsAnalysisOpen(true)
  };

  const closeIsAnakysis  = () => {
    setIsAnalysisOpen(false)
  };

  const filteredData = chartsConfig.filter((chartConfig: any) =>
      typeof chartConfig.title !== 'undefined' ? chartConfig.title.toLowerCase().includes(searchTerm.toLowerCase()) : false
  );

  const rows = Math.ceil(filteredData.length / 3);

  

  const renderPanels = () => {
    try {
      return (
        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <PanelGroup key={rowIndex} direction="horizontal" className="rounded-lg border gap-x-4">
              {filteredData.slice(rowIndex * 3, rowIndex * 3 + 3).map((config, index) => {
                const panelKey = rowIndex * 3 + index;
  
                return (
                  <React.Fragment key={panelKey}>
                    <Panel
                      key={`panel-${panelKey}`}
                      defaultSize={33.33}
                      style={{
                        height: '400px',
                      }}
                      className="bg-gray-400 border-2 border-gray-400 shadow-lg rounded-lg"
                    >
                      {/* ChartCard Component */}
                      <ChartCard
                        key={config.uuid}
                        config={config}
                        className={`draggable-card-${panelKey}`}
                      />
                    </Panel>
  
                    {/* Only render the resize handle if the current panel is not the 3rd one in the row */}
                    {index !== 2 && (
                      <PanelResizeHandle key={`resize-handle-${panelKey}`} className="flex w-px items-center justify-center bg-white">
                        <div className="z-10 flex h-6 w-4 items-center justify-center rounded-sm border bg-zinc-200">
                          <DragHandleDots2Icon className="h-4 w-4" />
                        </div>
                      </PanelResizeHandle>
                    )}
                  </React.Fragment>
                );
              })}
            </PanelGroup>
          ))}
        </div>
      );
    } catch (error) {
      console.error('Error rendering panels:', error);
      setHasError(true);
    }
  };
  
  
  

  return (
    <>
    
    
    
    <Box width="100%" minHeight={{base: "auto", md:"80vh"}}>
      <Helmet>
        <title>Dashboard | Africa Rangeland Watch | Sustainable Management</title>
        <meta name="description" content="dashboard data." />
      </Helmet>

      <Header />

      {/* Top Row */}
      <Flex
        justifyContent={{ base: "flex-start", md: "space-between" }}
        alignItems="center"
        flexDirection={{ base: "column", md: "row" }}
        marginBottom="6"
        wrap="wrap"
        w="95%"
        gap={{ base: "4", md: "4" }}
        padding={5}
        ml={{ base: 0, md: 6 }}
      >
          {/* Filter Button */}
          <Flex
            alignItems="center"
            gap="4"
            flex={{ base: "1", md: "auto" }}
            justifyContent={{ base: "flex-start", md: "flex-start" }}
            w={{ base: "100%", md: "30%" }}
          >
            <Button
              leftIcon={<FaFilter />}
              colorScheme="green"
              variant="solid"
              backgroundColor={isFilterActive ? "gray.500" : "dark_green.800"}
              _hover={{ backgroundColor: "light_green.400" }}
              fontWeight={700}
              w={{ base: "auto", md: "15%" }}
              h={10}
              color="white.a700"
              borderRadius="2px"
              isDisabled={isFilterActive}
              onClick={handleFilterClick}
            >
              Filter
            </Button>
            <Text fontSize="lg" color="black">
              {filteredData ? filteredData.length : 0} resources found.
            </Text>
          </Flex>

          {/* Search, New, Organise */}
          <Flex
            alignItems="center"
            gap="4"
            flexDirection={{ base: "column", md: "row" }}
            w={{ base: "100%", md: "40%" }}
            justifyContent={{ base: "flex-start", md: "flex-end" }}
          >
            <Input
              placeholder="Search resources..."
              w={{ base: "100%", md: "400px" }}
              size="md"
              onChange={(e) => setSearchTerm(e.target.value)}
              borderRadius="md" />
            <Button
              colorScheme="green"
              variant="solid"
              backgroundColor="dark_green.800"
              _hover={{ backgroundColor: "light_green.400" }}
              fontWeight={700}
              w={{ base: "100%", md: "auto" }}
              h={10}
              color="white.a700"
              borderRadius="2px"
              onClick={() => window.location.href = "/#/analysis-results"}
            >
              New
            </Button>
            <Image src="static/images/toggle_icon.svg" alt="toggle" h="15px" w="20px" />
            <Text color="black" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
              Organise by
            </Text>
          </Flex>
      </Flex>


      {/* Customizeable layouts */}


      {hasError ? (
        <p>Something went wrong while loading the panels.</p>
      ) : (
        renderPanels()
      )}



          

     
      {/* Filter Panel (Drawer) */}
      <DashboardFilters isOpen={isOpen} onClose={onClose} setSearchTerm={setSearchTerm} />

      {/* Analysis sidebar */}
      <AnalysisSideBar isOpen={isAnalysisOpen} onClose={() => { closeIsAnakysis(); } } selectedAnalysis={null} />

    </Box><Footer /></>
  );
};

export default DashboardPage;
