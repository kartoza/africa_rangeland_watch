import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  IconButton,
  Badge,
  SimpleGrid,
  Image,
  Heading,
  ButtonGroup,
  Checkbox,
  Select,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Grid,
} from "@chakra-ui/react";
import { FaFilter } from "react-icons/fa";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import Header from "../../components/Header";
import { Helmet } from "react-helmet";
import Footer from "../../components/Footer";
import AnalysisSideBar from "../../components/SideBar/AnalysisSideBar";
import Pagination from "../../components/Pagination";
import ChartCard from "../../components/ChartCard";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store";
import { fetchDashboards } from "../../store/dashboardSlice";



const DashboardPage: React.FC = () => {
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
        console.log(dashboardData)
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

  return (
    <><Box width="100%" height={{base: "auto", md:"100vh"}}>
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
                      {resourcesCount} resources found.
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

          <SimpleGrid
            // templateColumns="repeat(auto-fill, minmax(400px, 1fr))"
            columns={[1, 2, 3]}
            spacing="0"
            marginBottom={0}
            paddingLeft={{ base: "5%", md: "2.5%" }}
            templateColumns="repeat(auto-fill, minmax(500px, 1fr))"
            autoFlow="dense"
          >
            {chartsConfig.map((config, index) => (
                <ChartCard
                    key={config.uuid}
                    config={config}
                    className={`draggable-card-${index}`}
                />
            ))}
            </SimpleGrid>

          {/* Cards Section */}
          <SimpleGrid columns={[1, 2, 3, 4]} spacing="2" marginBottom={6} paddingLeft={{ base: "5%", md: "2.5%" }}>
              {loading ? (
                  <Text>Loading...</Text>
              ) : (
                  data
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((item) => (
                          <Box key={item.id} borderWidth="1px" borderRadius="lg" overflow="hidden" width="90%" height="250px">
                              {/* Image */}
                              <Image
                                  src={item.imageUrl}
                                  alt={item.title}
                                  objectFit="cover"
                                  width="100%"
                                  height="60%" />
                              {/* Card Content */}
                              <Box padding="2" height="40%">
                                  <Heading size="sm" mb="2" color="black">
                                      {item.title}
                                  </Heading>
                                  <Text fontSize="sm" noOfLines={2} mb="1" color="black">
                                      {item.description}
                                  </Text>
                                  <Flex justifyContent="space-between" alignItems="center">
                                      <Badge colorScheme="green">{item.userName}</Badge>
                                      <Button
                                          colorScheme="green"
                                          variant="solid"
                                          backgroundColor="dark_green.800"
                                          _hover={{ backgroundColor: "light_green.400" }}
                                          fontWeight={700}
                                          w={{ base: "50%", md: "auto" }}
                                          h={8}
                                          color="white.a700"
                                          borderRadius="4px"
                                          onClick={() => handleViewClick(item)}
                                      >
                                          View
                                      </Button>
                                  </Flex>
                              </Box>
                          </Box>
                      ))
                      
              )}
            {data.length > 11 && (
                <Flex mr={50}>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        handlePageChange={handlePageChange} />
                </Flex>
                )}
          </SimpleGrid>



          

          {/* Filter Panel (Drawer) */}
          <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
              <DrawerOverlay />
              <DrawerContent backgroundColor={"white"}>
                  <DrawerCloseButton />
                  <Flex alignItems="center" justifyContent="space-between" mb="4" paddingX="4">
                      <Flex alignItems="center" gap="2">
                          <FaFilter />
                          <Text fontSize="lg" fontWeight="bold" color={"black"}>
                              Filter
                          </Text>
                      </Flex>
                      <Button
                          colorScheme="green"
                          variant="outline"
                          borderColor="dark_green.800"
                          textColor="dark_green.800"
                          fontWeight={700}
                          h={8}
                          width={"40%"}
                          borderRadius="0px"
                          onClick={() => { } }
                          mr={35}
                          mt={2}
                      >
                          Clear Filters
                      </Button>
                  </Flex>

                  {/* Divider */}
                  <Box borderBottom="1px solid gray" mb="4" />
                  <DrawerBody>
                      {/* Search Field Inside Drawer */}
                      <Input
                          placeholder="Search resources..."
                          size="md"
                          borderRadius="md"
                          mb="4" />

                      {/* Filters inside Drawer */}
                      <Text fontWeight="bold" mt="4" color={"black"} mb={4} fontSize={18}>Resources</Text>
                      <Checkbox mb="4">My Resources</Checkbox>
                      <br></br>
                      <Checkbox mb="4">My Organisations</Checkbox>
                      <br></br>
                      <Checkbox mb="4">Favorites</Checkbox>
                      <br></br>
                      <Checkbox mb="4">My Dashboards</Checkbox>
                      <br></br>
                      <Checkbox mb="4">Datasets</Checkbox>


                      <br></br>
                      <Checkbox mb="2" ml={5}>EVI</Checkbox>
                      <br></br>
                      <Checkbox mb="2" ml={5}>NDVI</Checkbox>
                      <br></br>
                      <Checkbox mb="2" ml={5}>BACI</Checkbox>
                      <br></br>
                      <Checkbox mb="4" ml={5}>Bare Ground</Checkbox>

                      {/* Other Sections */}
                      <br></br>
                      <Checkbox mb="4">Maps</Checkbox>
                      <br></br>
                      <Checkbox mb="4">Map Viewers</Checkbox>
                      <br></br>
                      <Checkbox mb="4">Dashboards</Checkbox>

                      <Box mb="6">
                          <Text fontWeight="bold" color="black" mb="2" fontSize={16}>
                              Select Category
                          </Text>
                          <Select placeholder="Select Category">
                              <option value="category1">Category 1</option>
                              <option value="category2">Category 2</option>
                          </Select>
                      </Box>

                      <Box mb="6">
                          <Text fontWeight="bold" color="black" mb="2" fontSize={16}>
                              Select Keyword
                          </Text>
                          <Select placeholder="Select Keyword">
                              <option value="keyword1">Keyword 1</option>
                              <option value="keyword2">Keyword 2</option>
                          </Select>
                      </Box>

                      <Box mb="6">
                          <Text fontWeight="bold" color="black" mb="2" fontSize={16}>
                              Select Region
                          </Text>
                          <Select placeholder="Select Region">
                              <option value="region1">Region 1</option>
                              <option value="region2">Region 2</option>
                          </Select>
                      </Box>

                      <Box mb="6">
                          <Text fontWeight="bold" color="black" mb="2" fontSize={16}>
                              Select Owner
                          </Text>
                          <Select placeholder="Select Owner">
                              <option value="owner1">Owner 1</option>
                              <option value="owner2">Owner 2</option>
                          </Select>
                      </Box>

                  </DrawerBody>
              </DrawerContent>
          </Drawer>

          <AnalysisSideBar isOpen={isAnalysisOpen} onClose={() => { closeIsAnakysis(); } } selectedAnalysis={null} />


      </Box><Footer /></>
  );
};

export default DashboardPage;
