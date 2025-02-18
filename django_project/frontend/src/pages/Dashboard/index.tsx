import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  Image,
  useDisclosure,
  VStack,
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem,
  useToast,
  Grid,
  GridItem,
  Icon,
} from "@chakra-ui/react";
import { FaFilter } from "react-icons/fa";
import Header from "../../components/Header";
import { Helmet } from "react-helmet";
import Footer from "../../components/Footer";
import AnalysisSideBar from "../../components/SideBar/AnalysisSideBar";
import Pagination from "../../components/Pagination";
import ChartCard from "../../components/ChartCard";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { fetchDashboards, resetDashboardUpdated } from "../../store/dashboardSlice";
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import DashboardFilters from "../../components/DashboardFilters";
import { FaCog } from "react-icons/fa"; 
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { ResizableBox } from "react-resizable";


type DragPosition = {
  [key: number]: { x: number; y: number };
};

type CardPosition = {
  row: number;
  col: number;
};

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
  const [paginatedData, setPaginatedData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6)
  const [startIdx , setStartIdx] = useState(0);
  const [endIdx, setEndIdx] = useState(1);
  const [filters, setFilters] = useState(null);
  const { dashboardUpdated } = useSelector((state: RootState) => state.dashboard);
  const [landscapes, setLandscapes] = useState<string[]>([]);
  const [layoutMode, setLayoutMode] = useState("horizontal"); // Default layout
  const [layoutKey, setLayoutKey] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const toast = useToast();
  

  const toggleMenu = () => {
    setIsLayoutMenuOpen(prevState => !prevState);
  };

  const closeMenu = () => {
    setIsLayoutMenuOpen(false);
  };

  const handleFilterClick = () => {
    isOpen ? onClose() : onOpen();
  };

  const closeIsAnalysis  = () => {
    setIsAnalysisOpen(false)
  };

  useEffect(() => {
    dispatch(fetchDashboards(filters));
  }, [dispatch, filters]);


  useEffect(() => {
  if (dashboardUpdated) {
        dispatch(resetDashboardUpdated());
        dispatch(fetchDashboards(filters));
        toast({
          title: "Dashboard updated",
          description: "Action has been completed.If changes dont reflect immediately please refresh the page.",
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top-right",
          containerStyle: {
            backgroundColor: "#00634b",
            color: "white",
          },
        });
      }
    }, [dashboardUpdated]);


  // SEARCH FUNCTION
  const filteredData = chartsConfig.filter((chartConfig: any) =>
      typeof chartConfig.title !== 'undefined' ? chartConfig.title.toLowerCase().includes(searchTerm.toLowerCase()) : false
  );


  // LAYOUT
  const rows = Math.ceil(filteredData.length / 3);


  // RESPONSIVENESS
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


  // PAGINATION
  useEffect(() => {
    setCurrentPage(1)
    const itemsPerPage = layoutMode === "horizontal" ? 6 : layoutMode === "vertical" ? 2 : 4;
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const paginatedData = filteredData.slice(startIdx, endIdx);

    setStartIdx(startIdx)
    setEndIdx(endIdx)
    setItemsPerPage(itemsPerPage)
    setPaginatedData(paginatedData);
    setTotalPages(totalPages);
  }, [currentPage, layoutMode])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };


  const [dragPosition, setDragPosition] = useState<DragPosition>({});
  const [cards, setCards] = useState<{ id: number; position: CardPosition }[]>([]);

 
  // INTIALIZE CARDS 
  useEffect(() => {
    if (!loading && Array.isArray(dashboardData)) {

      const updatedChartsConfig = dashboardData.map((dashboard, index) => {

        const matchingCard = cards.find((card) => card.id === index + 1) || {
          id: index + 1,
          position: { row: Math.floor(index / 3), col: index % 3 },
          size: { width: 450, height: 400 }
        };

        return {
          config: dashboard.config,
          analysisResults: dashboard.analysis_results,
          title: dashboard.title,
          uuid: dashboard.uuid,
          owner: dashboard.owner,
          privacy_type: dashboard.privacy_type,
          card: matchingCard
        }
      });

      // Set the state to pass down to the chart cards
      setChartsConfig(updatedChartsConfig);

      if (dashboardData && Array.isArray(dashboardData)) {
        const extractedLandscapes = dashboardData.flatMap((data) => {
          if (data.analysis_results) {
            return data.analysis_results.flatMap((result: any) => {
              if (result.analysis_results) {
                return [result.analysis_results.data.landscape];
              }
              return [];
            });
          }
          return [];
        });
      
        // Remove duplicates
        const uniqueLandscapes = Array.from(new Set(extractedLandscapes));
        setLandscapes(uniqueLandscapes);
      }
      
      
    }
  }, [loading, dashboardData, cards]);

  

  const onDragEnd = (result: { destination: { index: number; }; source: { index: number; }; }) => {
    if (!result.destination) return;

    setChartsConfig((prevConfig) => {
      const updatedConfig = [...prevConfig];
      const [movedItem] = updatedConfig.splice(result.source.index, 1);
      updatedConfig.splice(result.destination.index, 0, movedItem);

      return updatedConfig.map((chart, index) => ({
        ...chart,
        card: {
          ...chart.card,
          position: { row: Math.floor(index / 3), col: index % 3 },
        },
      }));
    });
  };


  const renderPanels = () => {
    try {
      const paginatedData = filteredData.slice(startIdx, endIdx);

      return (
        <VStack spacing={6} align="stretch">
          {layoutMode === "horizontal" && (() => {

            return (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="dashboard" direction="horizontal">
                  {(provided) => (
                    <Grid
                      templateColumns="repeat(3, 1fr)"
                      gap={3}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {paginatedData.map((chart, index) => (
                        <Draggable key={chart.card.id.toString()} draggableId={chart.card.id.toString()} index={index}>
                          {(provided) => (
                            <GridItem
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              bg="gray.200"
                              border="1px solid"
                              borderColor="gray.300"
                              shadow="lg"
                              rounded="lg"
                              minH="400px"
                              minW="450px"
                              p={2}
                            >
                              <PanelGroup direction="vertical">
                                <Panel defaultSize={50} minSize={20}>
                                  <Panel
                                    minSize={20}
                                    style={{
                                      width: '100%',
                                      transition: 'opacity 0.3s ease',
                                    }}
                                  >
                                    <ChartCard config={chart} />
                                  </Panel>
                                  <PanelResizeHandle />
                                </Panel>
                              </PanelGroup>
                            </GridItem>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Grid>
                  )}
                </Droppable>
              </DragDropContext>
            );
          })()}

          {layoutMode === "vertical" && (() => {
            const extraPanels = paginatedData.length % 2 === 0 ? 0 : 2 - (paginatedData.length % 2);
            const balancedPanels = [...paginatedData, ...Array(extraPanels).fill(null)];

            return (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="dashboard" direction="vertical">
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{ display: "flex", flexDirection: "column", overflowY: "auto" }}
                      gap={3}
                    >
                      {balancedPanels.map((config, index) => {
                        const isDummy = config === null;
                        return (
                          <React.Fragment key={index}>
                            <Draggable draggableId={config ? config.card.id.toString() : `dummy-${index}`} index={index}>
                              {(provided) => (
                                <Box
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  bg="gray.200"
                                  border="1px solid"
                                  borderColor="gray.300"
                                  shadow="lg"
                                  rounded="lg"
                                  maxHeight="400px"
                                  maxWidth="100%"
                                  overflow="auto"
                                  p={6}
                                  opacity={isDummy ? 0 : 1}
                                  pointerEvents={isDummy ? "none" : "auto"}
                                >
                                  {!isDummy && <ChartCard config={config} />}
                                </Box>
                              )}
                            </Draggable>
                            {provided.placeholder}
                          </React.Fragment>
                        );
                      })}
                    </Box>
                  )}
                </Droppable>
              </DragDropContext>
            );
          })()}


          {layoutMode === "nested" && (() => {
            const smallPanels: any[] = [];
            const mainPanels: any[] = [];

            paginatedData.forEach((config, index) => {
              if (index % 4 === 0) {
                mainPanels.push(config); // Main panel (1 per 4)
              } else {
                smallPanels.push(config); // Small panels (3 rows)
              }
            });

            return (
              <PanelGroup direction="horizontal" style={{ height: "80vh" }}>
                <DragDropContext onDragEnd={onDragEnd}>
                  
                  {/* First column (small panels) */}
                  <Droppable droppableId="smallPanels" direction="vertical">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{ display: "flex", flexDirection: "column", width: "50%" }}
                      >
                        <Panel defaultSize={50} minSize={20}>
                          <PanelGroup direction="vertical">
                            {smallPanels.map((config, index) => (
                              <Draggable key={`small-panel-${config?.uuid}`} draggableId={config?.uuid.toString()} index={index}>
                                {(provided) => {
                                  return (
                                    <React.Fragment>
                                      <Panel
                                        defaultSize={100 / smallPanels.length}
                                        minSize={20}
                                        style={{
                                          marginBottom: "8px",
                                          transition: "opacity 0.3s ease",
                                        }}
                                      >
                                        <Flex
                                          bg={config?.bg || "gray.200"}
                                          h="100%"
                                          align="center"
                                          justify="center"
                                          p={2}
                                          border="1px solid"
                                          borderColor="gray.200"
                                          shadow="lg"
                                          rounded="lg"
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                        >
                                          <ChartCard key={`chart-card-${config?.uuid}`} config={config} />
                                        </Flex>
                                      </Panel>
                                      {index !== smallPanels.length - 1 && <PanelResizeHandle />}
                                    </React.Fragment>
                                  );
                                }}
                              </Draggable>
                            ))}
                          </PanelGroup>
                        </Panel>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  <PanelResizeHandle />

                  {/* Main panel (second column) */}
                  <Droppable droppableId="mainPanel" direction="horizontal">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{ display: "flex", flexDirection: "column", width: "50%", marginLeft: "10px" }}
                      >
                        <Draggable draggableId={mainPanels[0]?.uuid.toString()} index={0}>
                          {(provided) => (
                            <Panel
                              defaultSize={50}
                              minSize={20}
                              style={{
                                transition: "opacity 0.3s ease",
                              }}
                            >
                              <Flex
                                bg="gray.200"
                                h="100%"
                                align="center"
                                justify="center"
                                p={2}
                                border="1px solid"
                                borderColor="gray.200"
                                shadow="lg"
                                rounded="lg"
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                {mainPanels.length > 0 ? (
                                  <ChartCard key={`main-panel-${mainPanels[0]?.uuid}`} config={mainPanels[0]} />
                                ) : (
                                  <span>No main panels to display</span>
                                )}
                              </Flex>
                            </Panel>
                          )}
                        </Draggable>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </PanelGroup>
            );
          })()}




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


  
  
  // PERSIST LAYOUT SELECTION
  useEffect(() => {
    const savedLayoutMode = localStorage.getItem('layoutMode');
    const savedDragPosition = localStorage.getItem('dragPosition');

    if (savedLayoutMode) {
      setLayoutMode(savedLayoutMode);
    }

    if (savedDragPosition) {
      setDragPosition(JSON.parse(savedDragPosition));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('layoutMode', layoutMode);
    localStorage.setItem('dragPosition', JSON.stringify(dragPosition));
  }, [layoutMode, dragPosition]);

  

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
        w="100%"
        gap={{ base: "4", md: "4" }}
        padding={5}
        ml={{ base: 0, md: 0 }}
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
              {filteredData ? filteredData.length : 0} resource{ filteredData.length != 1 && 's' } found
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
            <Text fontSize="lg" color="gray.400" opacity={0.6} pointerEvents="none" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" cursor="pointer" ml={-2}>
              Organise by
            </Text>

            
          </Flex>


      {/* Customizeable layouts */}
        {/* Gear Icon Menu */}
        <Menu isOpen={isLayoutMenuOpen} onClose={closeMenu}>
          <MenuButton as="div" onClick={toggleMenu} aria-label="Layout Settings">
            <FaCog size={24} style={{ color: 'green' }} />
          </MenuButton>
          <Text fontSize="lg" color="black" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" onClick={toggleMenu} cursor="pointer" ml={-2}>
            Layout
          </Text>
          <MenuList>
            {!isMobile && (
              <MenuItem
                onClick={() => {
                  setLayoutMode("horizontal");
                  setLayoutKey(prevKey => prevKey + 1);
                  closeMenu();
                }}
                bg={layoutMode === 'horizontal' ? '#91e05e' : 'transparent'}
              >
                Horizontal
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                setLayoutMode("vertical");
                setLayoutKey(prevKey => prevKey + 1);
                closeMenu();
              }}
              bg={layoutMode === 'vertical' ? '#91e05e' : 'transparent'}
            >
              Vertical
            </MenuItem>
            <MenuItem
              onClick={() => {
                setLayoutMode("nested");
                setLayoutKey(prevKey => prevKey + 1);
                closeMenu();
              }}
              bg={layoutMode === 'nested' ? '#91e05e' : 'transparent'}
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
          key={layoutKey} 
          style={{
            padding: "18px",
          }}
        >
          {renderPanels()}
        </div>
      )}

     
      {/* Filter Panel (Drawer) */}
      <DashboardFilters 
        isOpen={isOpen}
        onClose={onClose}
        setSearchTerm={(searchTerm) => setFilters((prev: any) => ({ ...prev, searchTerm }))}
        setFilters={setFilters}
        filters={filters}
        landscapes={landscapes}
      />

      {/* Analysis sidebar */}
      <AnalysisSideBar isOpen={isAnalysisOpen} onClose={() => { closeIsAnalysis(); } } selectedAnalysis={null} />

    </Box><Footer /></>
  );
};

export default DashboardPage;
