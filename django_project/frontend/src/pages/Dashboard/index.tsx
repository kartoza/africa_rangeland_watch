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
import {InProgressBadge} from "../../components/InProgressBadge";
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { DragHandleDots2Icon } from '@radix-ui/react-icons';
import DashboardFilters from "../../components/DashboardFilters";
import { FaCog } from "react-icons/fa"; 
import Draggable, { DraggableData } from "react-draggable";


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
  // pagination variables
  const [paginatedData, setPaginatedData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6)
  const [startIdx , setStartIdx] = useState(0);
  const [endIdx, setEndIdx] = useState(1);
  const [filters, setFilters] = useState(null);
  const { dashboardUpdated } = useSelector((state: RootState) => state.dashboard);
  const [landscapes, setLandscapes] = useState<string[]>([]);
  const toast = useToast();
  const [panelPositions, setPanelPositions] = useState({});
  

  const toggleMenu = () => {
    setIsLayoutMenuOpen(prevState => !prevState);
  };

  const closeMenu = () => {
    setIsLayoutMenuOpen(false);
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
  const [layoutKey, setLayoutKey] = useState(0);
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
    const itemsPerPage = layoutMode === "horizontal" ? 6 : layoutMode === "vertical" ? 3 : 4;
    
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
  }, [currentPage, layoutMode])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  var render = 0;

  const [dragPosition, setDragPosition] = useState<DragPosition>({});
const [cards, setCards] = useState<{ id: number; position: CardPosition }[]>([]); // Store card positions

// Initialize cards with positions
const initialized = useRef(false);

useEffect(() => {
  if (!initialized.current && filteredData.length > 0) {
    const initialCards = filteredData.map((_, index) => ({
      id: index,
      position: { row: Math.floor(index / 3), col: index % 3 },
    }));
    setCards(initialCards);
    initialized.current = true; // Prevents re-initialization
  }
}, [filteredData]); 

// Handler for dragging move (during dragging)
const handleDragMove = (data: DraggableData, panelKey: number) => {
  setDragPosition((prevState) => ({
    ...prevState,
    [panelKey]: { x: data.x, y: data.y },
  }));
};

const handleDragStop = (panelKey: number, data: any) => {
  const newX = data.x;
  const newY = data.y;

  // Logic to check the new position and swap cards
  const currentCard = cards.find((card) => card.id === panelKey);
  if (!currentCard) return;

  // Calculate the target row and column based on the drag position
  let targetRow = Math.floor(newY / 200);  // Assuming each card height is 200px
  let targetCol = Math.floor(newX / 200);  // Assuming each card width is 200px

  // Ensure we stay within bounds of the grid
  const maxRows = Math.ceil(cards.length / 3); // assuming 3 cards per row
  const maxCols = 3; // 3 columns per row

  if (targetRow >= maxRows) targetRow = maxRows - 1;
  if (targetCol >= maxCols) targetCol = maxCols - 1;

  // Find the card at the target position
  const targetCard = cards.find(
    (card) => card.position.row === targetRow && card.position.col === targetCol
  );

  if (targetCard && currentCard.id !== targetCard.id) {
    // Swap positions of the cards
    setCards((prevCards) => {
      const updatedCards = [...prevCards];
      const currentIndex = updatedCards.findIndex((card) => card.id === panelKey);
      const targetIndex = updatedCards.findIndex((card) => card.id === targetCard.id);

      if (currentIndex >= 0 && targetIndex >= 0) {
        // Swap the positions of the two cards
        updatedCards[currentIndex].position = targetCard.position;
        updatedCards[targetIndex].position = currentCard.position;
      }

      return updatedCards;
    });
  }

  // Reset the drag position after moving
  setDragPosition((prevState) => ({
    ...prevState,
    [panelKey]: { x: 0, y: 0 },
  }));
};

const moveCard = (panelKey: number, direction: string) => {
  setCards((prevCards) => {
    const updatedCards = [...prevCards];
    const currentIndex = updatedCards.findIndex((card) => card.id === panelKey);

    if (currentIndex === -1) return prevCards;

    const currentCard = updatedCards[currentIndex];
    let targetRow = currentCard.position.row;
    let targetCol = currentCard.position.col;

    // Determine new position based on direction
    if (direction === "left") targetCol -= 1;
    if (direction === "right") targetCol += 1;
    if (direction === "up") targetRow -= 1;
    if (direction === "down") targetRow += 1;

    // Find target card
    const targetIndex = updatedCards.findIndex(
      (card) => card.position.row === targetRow && card.position.col === targetCol
    );

    if (targetIndex !== -1) {
      // Clone cards to ensure state updates correctly
      const newCards = updatedCards.map((card, index) =>
        index === currentIndex
          ? { ...card, position: { row: targetRow, col: targetCol } } // Swap current card
          : index === targetIndex
          ? { ...card, position: { row: currentCard.position.row, col: currentCard.position.col } } // Swap target card
          : card
      );

      return newCards; // ✅ Return a new array reference to trigger a re-render
    }

    return prevCards; // No change if target position is invalid
  });
};

 

useEffect(() => {
  if (!loading && Array.isArray(dashboardData)) {

   

    const updatedChartsConfig = dashboardData.map((dashboard, index) => {

      const matchingCard = cards.find((card) => card.id === index + 1) || {
        id: index + 1,
        position: { row: Math.floor(index / 3), col: index % 3 },
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

  const renderPanels = () => {
    try {
      const paginatedData = filteredData.slice(startIdx, endIdx);

      return (
        <VStack spacing={6} align="stretch">
          {Array.from({ length: rows }).map((_, rowIndex) => {
            const rowPanels = paginatedData.slice(rowIndex * 3, rowIndex * 3 + 3);

            if (layoutMode === "horizontal") {
              render = 0;
              const remainder = chartsConfig.length % 3;
              const extraPanels = remainder === 0 ? 0 : 3 - remainder;
            
              // Create an array with original charts + dummy panels to maintain grid layout
              const balancedPanels = [...chartsConfig, ...Array(extraPanels).fill(null)];
            
              console.log("Current Card Positions:", chartsConfig);
            
              // Sort charts based on card positions
              const sortedCharts = [...balancedPanels].filter(Boolean).sort((a, b) => 
                a.card.position.row === b.card.position.row
                  ? a.card.position.col - b.card.position.col
                  : a.card.position.row - b.card.position.row
              );
            
              return (
                <VStack spacing={6} align="stretch">
                  {Array.from({ length: rows }).map((_, rowIndex) => {
                    const rowPanels = sortedCharts.slice(rowIndex * 3, rowIndex * 3 + 3);
            
                    return (
                      <PanelGroup key={rowIndex} direction="horizontal" style={{ display: "flex", gap: "6px" }}>
                        {rowPanels.map((chart, index) => (
                          <Box key={`panel-${chart.card.id}`} width="33.33%" minHeight="200px" position="relative">
                            <Flex
                              bg="gray.200"
                              border="1px solid"
                              borderColor="gray.200"
                              shadow="lg"
                              rounded="lg"
                              align="center"
                              justify="center"
                              height="100%"
                              direction="column"
                            >
                              <div style={{ width: "100%", height: "100%" }}>
                                <ChartCard config={chart} />
                                {chart.card.id}
                              </div>
            
                              {/* Arrows for moving the card */}
                              <Flex justify="center" gap="2" mt="2">
                                <Button size="xs" onClick={() => moveCard(chart.card.id, "left")}>⬅️</Button>
                                <Button size="xs" onClick={() => moveCard(chart.card.id, "right")}>➡️</Button>
                                <Button size="xs" onClick={() => moveCard(chart.card.id, "up")}>⬆️</Button>
                                <Button size="xs" onClick={() => moveCard(chart.card.id, "down")}>⬇️</Button>
                              </Flex>
                            </Flex>
                          </Box>
                        ))}
                      </PanelGroup>
                    );
                  })}
                </VStack>
              );
            }
            
            

            if (layoutMode === "vertical") {
              render = 0;
              const remainder = rowPanels.length % 3;
              const extraPanels = remainder === 0 ? 0 : 3 - remainder;
              const balancedPanels = [...rowPanels, ...Array(extraPanels).fill(null)];
              if (rowPanels.length === 0) {
                return null;
              }
            
              return (
                <PanelGroup
                  key={rowIndex}
                  direction="vertical"
                  style={{
                    display: "flex",
                    gap: "6px",
                    flexDirection: "column",
                    overflowY: "auto"
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
                            padding: "4px",
                            flex: "1",
                            opacity: isDummy ? 0 : 1,
                            pointerEvents: isDummy ? "none" : "auto",
                          }}
                        >
                          <Box
                          key={`panel-${panelKey}`}
                          minHeight="200px"
                          opacity={isDummy ? 0 : 1}
                          pointerEvents={isDummy ? "none" : "auto"}
                          position="relative"
                        >
                          <Flex
                            bg="gray.200"
                            border="1px solid"
                            borderColor="gray.200"
                            shadow="lg"
                            rounded="lg"
                            align="center"
                            justify="center"
                            h="100%"
                            p={2}
                          >
                            {!isDummy && 
                              <div style={{ width: "100%", height: "100%" }}>
                                <ChartCard
                                  key={config.uuid}
                                  config={config}
                                  className={`draggable-card-${panelKey}`}
                                />
                            </div>
                            }
                          </Flex>
                          </Box>
                        </Panel>
            
                        {!isDummy && index !== balancedPanels.length - 1 && (
                          <PanelResizeHandle key={`resize-handle-${panelKey}`}></PanelResizeHandle>
                        )}
                      </React.Fragment>
                    );
                  })}
                </PanelGroup>
              );
            }



            if (layoutMode === "nested" && render == 0) {
              ++render;
              const totalPanels = filteredData.length;
              const smallPanels: any[] = [];
              const mainPanels: any[] = [];
            
              // Distribute panels dynamically
              filteredData.forEach((config, index) => {
                if (index % 4 === 0) {
                  mainPanels.push(config); // Every 4th panel goes to Main Panel
                } else {
                  smallPanels.push(config); // Others go to Small Panels
                }
              });
            
              console.log('main panels', mainPanels);
            
              return (
                <PanelGroup key={rowIndex} direction="horizontal" style={{ height: "80vh" }}>
                  {/* Small Panels Container */}
                  <Panel defaultSize={50} minSize={20}>
                    <PanelGroup direction="vertical">
                      {smallPanels.map((config, index) => (
                        <React.Fragment key={`small-panel-${config?.uuid}-${index}`}>
                          <Panel defaultSize={100 / smallPanels.length} minSize={20} style={{ marginBottom: "8px" }}>
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
                            >
                              <div style={{ width: "100%", height: "100%" }}>
                                <ChartCard 
                                  key={`chart-card-${config?.uuid}-${index}`} 
                                  config={config} 
                                  className={`draggable-card-${index}`}
                                />
                              </div>
                            </Flex>
                          </Panel>
                          {index !== smallPanels.length - 1 && <PanelResizeHandle />}
                        </React.Fragment>
                      ))}
                    </PanelGroup>
                  </Panel>
            
                  <PanelResizeHandle />
            
                  {/* Main Panel Container */}
                  <Panel defaultSize={50} minSize={20}>
                    <Flex 
                      bg="gray.200" 
                      h="100%" 
                      align="center" 
                      justify="center" 
                      flexWrap="wrap" 
                      p={2}
                      border="1px solid"
                      borderColor="gray.200"
                      shadow="lg"
                      rounded="lg"
                      ml={3}
                    >
                      {mainPanels.length > 0 ? (
                        mainPanels.map((config) => (
                          <div key={`main-panel-${config?.uuid}`} style={{ width: "100%", height: "100%" }}>
                            <ChartCard config={config} />
                          </div>
                        ))
                      ) : (
                        <span>No main panels to display</span>
                      )}
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

  
  
  // Retrieve saved layout from localStorage on component mount
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

  // Save layout to localStorage whenever it changes
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
            <Text color="black" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
              Organise by
            </Text>
            
          </Flex>


      {/* Customizeable layouts */}

      {/* Gear Icon Menu */}
      <Menu isOpen={isLayoutMenuOpen} onClose={closeMenu}>
        <Text color="black" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
          Layout
        </Text>
        <MenuButton as="div" onClick={toggleMenu} aria-label="Layout Settings">
          <FaCog size={24} style={{ color: 'green' }} />
        </MenuButton>
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
      <AnalysisSideBar isOpen={isAnalysisOpen} onClose={() => { closeIsAnakysis(); } } selectedAnalysis={null} />

    </Box><Footer /></>
  );
};

export default DashboardPage;
