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
  VStack,
  IconButton,
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem,
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
import { FaCog } from "react-icons/fa"; 



const DashboardPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const dashboardData = useSelector((state: any) => state.dashboard.dashboards);
  const loading = useSelector((state: any) => state.dashboard.loading);
  const error = useSelector((state: any) => state.dashboard.error);
  const [chartsConfig, setChartsConfig] = useState([]);
  const [hasError, setHasError] = useState(false);
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  // pagination variables
  const [paginatedData, setPaginatedData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6)
  const [startIdx , setStartIdx] = useState(0);
  const [endIdx, setEndIdx] = useState(1);

  const toggleMenu = () => {
    setIsLayoutMenuOpen(prevState => !prevState);
  };

  const closeMenu = () => {
    setIsLayoutMenuOpen(false);
  };

  // Function to reset the panel dimensions
  const resetPanelDimensions = () => {
    // Logic to reset the layout dimensions can go here, if required
    console.log("Dimensions reset!");
  };


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

  const [layoutMode, setLayoutMode] = useState("horizontal"); // Default layout
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Effect to update layout mode when screen size changes
  useEffect(() => {
    const handleResize = () => {
      const mobileView = window.innerWidth < 768;
      setIsMobile(mobileView);

      // Force vertical layout on mobile
      if (mobileView) {
        setLayoutMode("vertical");
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Check on mount

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Recalculate items per page based on the layout mode
    const itemsPerPage = layoutMode === "horizontal" ? 6 : layoutMode === "vertical" ? 3 : 1;
    
    // Calculate total pages
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // Recalculate the paginated data for the current page
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const paginatedData = filteredData.slice(startIdx, endIdx);

    setStartIdx(startIdx)
    setEndIdx(endIdx)
    setItemsPerPage(itemsPerPage)
    setPaginatedData(paginatedData);
    setTotalPages(totalPages);
  }, [layoutMode, currentPage, filteredData])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

 

  const renderPanels = () => {
    try {
      const paginatedData = filteredData.slice(startIdx, endIdx);

      return (
        <VStack spacing={6} align="stretch">
          {Array.from({ length: rows }).map((_, rowIndex) => {
            const rowPanels = paginatedData.slice(rowIndex * 3, rowIndex * 3 + 3);
            const nestedPanelsRows = filteredData.slice(rowIndex * 3, rowIndex * 3 + 3);

            if (layoutMode === "horizontal") {
              const remainder = rowPanels.length % 3;
              const extraPanels = remainder === 0 ? 0 : 3 - remainder;
            
              // Create an array with original panels + dummy panels
              const balancedPanels = [...rowPanels, ...Array(extraPanels).fill(null)];
            
              return (
                <PanelGroup
                  key={rowIndex}
                  direction="horizontal"
                  style={{ display: "flex", justifyContent: "center", gap: "4px" }}
                >
                  {balancedPanels.map((config, index) => {
                    const panelKey = rowIndex * 3 + index;
                    const isDummy = config === null;
            
                    return (
                      <React.Fragment key={panelKey}>
                        <Panel
                          key={`panel-${panelKey}`}
                          defaultSize={33.33}
                          minSize={20}
                          style={{
                            height: "400px",
                            padding: "8px",
                            opacity: isDummy ? 0 : 1,
                            pointerEvents: isDummy ? "none" : "auto",
                          }}
                        >
                          <Flex
                            bg="gray.400"
                            border="2px solid"
                            borderColor="gray.500"
                            shadow="lg"
                            rounded="lg"
                            align="center"
                            justify="center"
                            h="100%"
                            p={4}
                          >
                            {!isDummy && <span>Each panel</span>}
                          </Flex>
                        </Panel>
            
                        {/* Add resize handle only for non-dummy panels */}
                        {!isDummy && index !== balancedPanels.length - 1 && (
                          <PanelResizeHandle key={`resize-handle-${panelKey}`}>
                          </PanelResizeHandle>
                        )}
                      </React.Fragment>
                    );
                  })}
                </PanelGroup>
              );
            }
            

            if (layoutMode === "vertical") {
              const remainder = rowPanels.length % 3;
              const extraPanels = remainder === 0 ? 0 : 3 - remainder;
            
              // Create an array with original panels + dummy panels
              const balancedPanels = [...rowPanels, ...Array(extraPanels).fill(null)];
            
              return (
                <PanelGroup
                  key={rowIndex}
                  direction="vertical"
                  style={{
                    height: "80vh",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {balancedPanels.map((config, index) => {
                    const panelKey = rowIndex * 3 + index;
                    const isDummy = config === null;
            
                    return (
                      <React.Fragment key={panelKey}>
                        <Panel
                          key={`panel-${panelKey}`}
                          defaultSize={100 / balancedPanels.length}
                          minSize={20}
                          style={{
                            padding: "8px",
                            flex: "1",
                            opacity: isDummy ? 0 : 1,
                            pointerEvents: isDummy ? "none" : "auto",
                          }}
                        >
                          <Flex
                            bg="gray.400"
                            border="2px solid"
                            borderColor="gray.500"
                            shadow="lg"
                            rounded="lg"
                            align="center"
                            justify="center"
                            h="100%"
                            p={4}
                          >
                            {!isDummy && <span>Each panel</span>}
                          </Flex>
                        </Panel>
            
                        {!isDummy && index !== balancedPanels.length - 1 && (
                          <PanelResizeHandle key={`resize-handle-${panelKey}`}>
                          </PanelResizeHandle>
                        )}
                      </React.Fragment>
                    );
                  })}
                </PanelGroup>
              );
            }
            
            

            if (layoutMode === "nested") {
              const remainder = nestedPanelsRows.length % 3;
              const extraPanels = remainder === 0 ? 0 : 3 - remainder;
            
              const balancedPanels = [...nestedPanelsRows, ...Array(extraPanels).fill(null)];
            
              return (
                <PanelGroup key={rowIndex} direction="horizontal" style={{ height: "80vh" }}>
                  <Panel defaultSize={50} minSize={20}>
                    <PanelGroup direction="vertical">
                      {balancedPanels.map((config, index) => {
                        const isDummy = config === null;
            
                        return (
                          <React.Fragment key={isDummy ? `dummy-${index}` : config?.key}>
                            <Panel
                              defaultSize={100 / balancedPanels.length}
                              minSize={20}
                              style={{
                                opacity: isDummy ? 0 : 1,
                                pointerEvents: isDummy ? "none" : "auto",
                                marginBottom: isDummy ? "0" : "8px",
                                marginRight: isDummy ? "0" : "8px",
                              }}
                            >
                              <Flex
                                bg={isDummy ? "transparent" : config?.bg || "gray.400"}
                                h="100%"
                                align="center"
                                justify="center"
                              >
                                {!isDummy && <span>{config?.label || "Panel"}</span>}
                              </Flex>
                            </Panel>
            
                            {/* Add resize handle only for non-dummy panels */}
                            {!isDummy && index !== balancedPanels.length - 1 && <PanelResizeHandle />}
                          </React.Fragment>
                        );
                      })}
                    </PanelGroup>
                  </Panel>
                  <PanelResizeHandle />
                  <Panel defaultSize={50} minSize={20}>
                    <Flex bg="gray.600" h="100%" align="center" justify="center">
                      <span>Main Panel</span>
                    </Flex>
                  </Panel>
                </PanelGroup>
              );
            }
            return null;
          })}

           {/* Pagination controls */}
            <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredData.length / itemsPerPage)}
                handlePageChange={handlePageChange}
             />
        </VStack>
      );
    } catch (error) {
      console.error("Error rendering panels:", error);
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


      {/* Customizeable layouts */}

      {/* Gear Icon Menu */}
      <Menu isOpen={isLayoutMenuOpen} onClose={closeMenu}>
        <MenuButton as="div" onClick={toggleMenu} aria-label="Layout Settings">
          <FaCog size={24} />
        </MenuButton>
        <MenuList>
          {!isMobile && (
            <MenuItem
              onClick={() => {
                setLayoutMode("horizontal");
                resetPanelDimensions();
                closeMenu();
              }}
            >
              Horizontal
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              setLayoutMode("vertical");
              resetPanelDimensions();
              closeMenu();
            }}
          >
            Vertical
          </MenuItem>
          <MenuItem
            onClick={() => {
              setLayoutMode("nested");
              resetPanelDimensions();
              closeMenu();
            }}
          >
            Nested
          </MenuItem>
        </MenuList>
      </Menu>
    </Flex>



     
      {hasError ? (
        <p>Something went wrong while loading the dashboards.</p>
      ) : (
        <div
          style={{
            border: "2px solid red",
            padding: "18px",
          }}
        >
          {renderPanels()}
        </div>
      )}




          

     
      {/* Filter Panel (Drawer) */}
      <DashboardFilters isOpen={isOpen} onClose={onClose} setSearchTerm={setSearchTerm} />

      {/* Analysis sidebar */}
      <AnalysisSideBar isOpen={isAnalysisOpen} onClose={() => { closeIsAnakysis(); } } selectedAnalysis={null} />

    </Box><Footer /></>
  );
};

export default DashboardPage;
