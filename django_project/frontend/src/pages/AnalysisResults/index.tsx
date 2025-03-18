import React, { useState, useEffect } from "react";
import Helmet from "react-helmet";
import {
  Box,
  Heading,
  Flex,
  Input,
  Button,
  Divider,
  Text,
  Card,
  CardBody,
  Tag,
  TagLabel,
  useDisclosure,
  Checkbox,
  useToast,
  Collapse,
  IconButton,
  SimpleGrid,
  Select,
} from "@chakra-ui/react";
import { FaFilter } from "react-icons/fa";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import { FaLocationDot } from "react-icons/fa6";

import { useNavigate } from 'react-router-dom';
import AnalysisSideBar from "../../components/SideBar/AnalysisSideBar";
import "../../styles/index.css";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store";
import { deleteAnalysis, fetchAnalysis } from "../../store/userAnalysisSlice";
import "maplibre-gl/dist/maplibre-gl.css"; 
import CreateDashboardModal from "../../components/CreateDashboard";
import { format } from 'date-fns';
import { IoCloseSharp } from "react-icons/io5";
import { ChevronUpIcon } from "@chakra-ui/icons";
import Pagination from "../../components/Pagination";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";
import { getAnalysisSummary } from "../../utils/analysisSummary";

interface FeatureProperties {
  Project?: string;
  Name?: string;
}

interface Feature {
  properties?: FeatureProperties;
}

interface AnalysisResults {
  results?: { features?: Feature[] }[];
  data?: {
    analysisType?: string;
    latitude?: number;
    longitude?: number;
  };
}

export default function AnalysisResults() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState([]);
  const [viewAnalysis, setViewAnalysis] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isCreateDashboardOpen, setCreateDashboard] = useState(false);
  const navigate = useNavigate()

  const dispatch = useDispatch<AppDispatch>();
  const analysisData = useSelector((state: any) => state.userAnalysis.data);
  const loading = useSelector((state: any) => state.userAnalysis.loading);
  const error = useSelector((state: any) => state.userAnalysis.error);
  const analysisDeleted = useSelector((state: any) => state.userAnalysis.analysisDeleted);
  const [showDeletionMessage, setShowDeletionMessage] = useState(false);
  const toast = useToast();
  const [isConfrimDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const onConfirmDeleteClose = () => setIsConfirmDeleteOpen(false);
  const cancelRef = React.useRef();
  const [region, setRegion] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;


  useEffect(() => {
    dispatch(fetchAnalysis());
  }, [dispatch]);


  const handleDelete = (id: any) => {
    onConfirmDeleteClose();

    if(selectedAnalysis.length == 0){
      dispatch(deleteAnalysis(id));
    }else {
      selectedAnalysis.forEach((analysisId) => {
        dispatch(deleteAnalysis(analysisId));
      });
    }

    setShowDeletionMessage(true)
  };

  useEffect(() => {
    dispatch(fetchAnalysis());
  }, [dispatch]);

  useEffect(() => {
   if(analysisDeleted && showDeletionMessage){
    toast({
      title: "Analysis Results Deleted.",
      description: "The analysis results have been successfuly deleted and removed from any associated dashboards.",
      status: "success",
      duration: 5000,
      isClosable: true,
      position: "top-right",
      containerStyle: {
        backgroundColor: "#00634b",
        color: "white",
      },
    });
    setShowDeletionMessage(false);
    dispatch(fetchAnalysis());
   }
  }, [analysisDeleted]);

  
  

  // Filtering based on search term
  const filteredData = analysisData.filter((analysis: any) => {
    const title = getAnalysisSummary(analysis)?.title?.toLowerCase() || "";
    const titleMatches = title.includes(searchTerm.toLowerCase());
  
    const typeMatches = type
      ? analysis?.analysis_results?.data?.analysisType?.toLowerCase() === type
      : true;
  
    const dateMatches = date
      ? format(new Date(analysis?.created_at || ""), "yyyy-MM-dd") === date
      : true;
  
    const regionMatches = region
      ? analysis?.analysis_results?.data?.landscape.toLowerCase() === region.toLowerCase()
      : true;
  
    return titleMatches && typeMatches && dateMatches && regionMatches;
  });

  
  

  const handleViewClick = (analysis: any) => {
    setViewAnalysis(analysis)
    onOpen();
  };

  const handleCheckboxChange = (isChecked: boolean, analysisId: any) => {
    setSelectedAnalysis((prevSelected: any[]) => {
      if (isChecked) {
        // Add the selected analysis to the array
        return [...prevSelected, analysisId];
      } else {
        // Remove the unselected analysis from the array
        return prevSelected.filter(id => id !== analysisId);
      }
    });
  };

  const handleCreateDashboardClick = () => {

     // Filter analysis data based on selected analysis IDs
    const matchedAnalysis = analysisData.filter((item: { id: any; }) => selectedAnalysis.includes(item.id));

    // Extract analysis types from the matched analysis objects
    const analysisTypes = matchedAnalysis.map((item: { analysis_results: { data: { analysisType: any; }; }; }) => item.analysis_results.data?.analysisType);

    // Check if all analysis types are the same
    const allSameType = analysisTypes.every((type: any) => type === analysisTypes[0]);

    if (!allSameType) {
      toast({
        title: "Cannot create dashboard.",
        description: `Can only create a dashboard from analysis results with the same analysis type! Current selected results have: ${analysisTypes.join(", ")}`,
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top-right",
        containerStyle: {
          backgroundColor: "#00634b",
          color: "white",
        },
      });
      return;
    }
    // Open the Create Dashboard modal
    setCreateDashboard(true);
  };
  
  function handleSave(): void {
    throw new Error("Function not implemented.");
  }


  const landscapeOptions = Array.from(
    new Set(
      analysisData
        .map((analysis: any) => analysis?.analysis_results?.data?.landscape)
        .filter(Boolean) // Remove undefined/null values
    )
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <Helmet>
        <title>Analysis Results - View Analysis Data</title>
        <meta name="description" content="View detailed analysis results and reports." />
      </Helmet>
      <Header />
  
      <Box bg="white" w="100%">
        <Flex direction={{ base: "column", md: "row" }} gap="30px" alignItems="start">
          {/* Sidebar */}
          <Sidebar display={{ base: "none", md: "flex" }} />
  
          {/* Main Content */}
          <Box
            flex="1"
            ml={{ base: "35px", md: "0px" }}
            mt={{ base: "15px", md: "20px" }}
            width={{ base: "80%", md: "auto" }}
            overflow={"auto"}
          >
            <Heading size="lg" mb={6} color="black">
              Analysis Results
            </Heading>
  
            {/* Search & Action Row */}
            <Flex justify="space-between" align="center" mb={6} direction={{ base: "column", md: "row" }}>
              <Box width={{ base: "100%", md: "50%" }} mb={{ base: 4, md: 0 }} ml={{ md: "0px" }}>
                <Flex direction={{ base: "column", md: "row" }} gap={4} align="center">
                  {/* Filter Button */}
                  <Button
                    leftIcon={isFilterOpen ? undefined : <FaFilter />}
                    rightIcon={isFilterOpen ? <ChevronUpIcon boxSize={6} /> : undefined}
                    colorScheme="green"
                    variant="solid"
                    backgroundColor="dark_green.800"
                    _hover={{ backgroundColor: "light_green.400" }}
                    fontWeight={700}
                    w={{ base: "100%", md: "auto" }}
                    h={10}
                    color="white"
                    borderRadius="5px"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    transition="all 0.3s ease-in-out"
                  >
                    {!isFilterOpen ? "Filter" : ""}
                  </Button>

                  {/* Search Input */}
                  <Input
                    placeholder="Search analysis"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    borderColor="gray.400"
                    width="100%"
                  />
                </Flex>
              </Box>

              {/* Create Dashboard and New Analysis Buttons */}
              <Box
                display="flex"
                gap={2}
                width={{ base: "100%", md: "auto" }}
                mb={{ base: 4, md: 0 }}
                flexDirection={{ base: "column", md: "row" }}
              >
                <Button
                  colorScheme="green"
                  variant="outline"
                  borderColor="dark_green.800"
                  textColor="dark_green.800"
                  w="auto"
                  borderRadius="0px"
                  h={10}
                  isDisabled={selectedAnalysis?.length === 0}
                  onClick={handleCreateDashboardClick}
                >
                  Create Dashboard
                </Button>
                <Button
                  colorScheme="green"
                  variant="outline"
                  borderColor="dark_green.800"
                  textColor="dark_green.800"
                  w="auto"
                  borderRadius="0px"
                  h={10}
                  onClick={() => navigate("/map")}
                >
                  New Analysis
                </Button>
              </Box>
            </Flex>

            {/* Filter Section */}
            <Collapse in={isFilterOpen} animateOpacity>
              <Box
                bg="gray.100"
                p={4}
                borderRadius="10px"
                boxShadow="md"
                width={{ base: "90%", md: "50%" }} // Reduced width
                alignSelf="flex-start" 
              >
                <Flex justify="space-between" align="center" mb={3}>
                  <Text fontSize="lg" fontWeight="bold" color="gray.700">
                    Filter Analysis
                  </Text>
                  <IconButton
                    icon={<IoCloseSharp />}
                    size="sm"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    aria-label="Close filters"
                    variant="ghost"
                    color="gray.600"
                    _hover={{ color: "red.500" }}
                  />
                </Flex>

                {/* 2-column layout for fields */}
                <SimpleGrid columns={2} spacing={4}>
                  {/* Region Dropdown */}
                  <Select 
                    placeholder="Select Region" 
                    value={region} 
                    onChange={(e) => setRegion(e.target.value)} 
                    borderColor="gray.400"
                  >
                    {landscapeOptions.map((landscape, index) => (
                      <option key={index} value={String(landscape)}>
                        {String(landscape)}
                      </option>
                    ))}
                  </Select>

                  {/* Date Field */}
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    borderColor="gray.400"
                  />

                  {/* Type Filter */}
                  <Select placeholder="Select Type" value={type} onChange={(e) => setType(e.target.value)} borderColor="gray.400">
                    <option value="baseline">Baseline</option>
                    <option value="temporal">Temporal</option>
                    <option value="spatial">Spatial</option>
                  </Select>


                  {/* Apply Filters Button */}
                  <Button 
                    onClick={() => {
                      setRegion("");
                      setDate("");
                      setType("");
                    }}
                    colorScheme="teal"
                    variant="outline"
                    borderColor="teal.500"
                    textColor="teal.600"
                    fontWeight={700}
                    h={8}
                    width="100%"
                    borderRadius="md"
                  >
                    Clear Filters
                  </Button>

                </SimpleGrid>
              </Box>
            </Collapse>

            {/* Content Section */}
            <Divider mb={6} borderColor="black" borderWidth="1px" width="calc(100% - 10px)" mt={4}/>

            {loading && <Text>Loading...</Text>}
            {!loading && !filteredData?.length && <Text>No analysis data available.</Text>}
            {error && <Text>{error}</Text>}

            {/* Analysis Cards Section */}
            <Box
              maxHeight="calc(100vh - 250px)"
              overflowY="auto"
              mb={6}
              display="flex"
              flexDirection="column"
              gap={4}
            >
              {paginatedData?.length === 0 ? (
                <Flex justify="center" align="center" height="200px">
                  <Text fontSize="lg" fontWeight="bold" color="gray.500">
                    No data available
                  </Text>
                </Flex>
                ) : (
                  paginatedData?.map((analysis: any, index: number) => {
                    let analysisSummary = getAnalysisSummary(analysis)

                    return (
                      <Card key={index} boxShadow="md" borderRadius="md" bg="gray.50">
                        <CardBody>
                          <Flex
                            direction={{ base: "column", md: "row" }}
                            align="stretch"
                            gap={4}
                            justify="space-between"
                          >
                            <Checkbox
                              isChecked={selectedAnalysis.includes(analysis?.id)}
                              onChange={(e) =>
                                handleCheckboxChange(e.target.checked, analysis?.id)
                              }
                            />

                            {/* Content */}
                            <Box
                                flex="1"
                                display="flex"
                                flexDirection="column"
                                justifyContent="space-between"
                                onClick={() => handleCheckboxChange(!selectedAnalysis.includes(analysis?.id), analysis?.id)}
                                cursor="pointer"
                              >

                              <Heading size="md" fontWeight="bold" color="black" mb={2}>
                                {analysisSummary.title}
                              </Heading>

                              { analysisSummary.latitude &&
                                  <Flex><FaLocationDot/><Text color={'black'} textStyle="xs">{analysisSummary.latitude}, {analysisSummary.longitude}</Text></Flex>
                              }

                              <Box mt={4} display="flex" flexWrap="wrap" gap={2}>
                                <Tag colorScheme="green" mr={2}>
                                  <TagLabel>
                                    {format(new Date(analysis?.created_at), "MMMM dd, yyyy HH:mm:ss")}
                                  </TagLabel>
                                </Tag>
                                <Tag colorScheme="blue" mr={2}>
                                  <TagLabel>{analysisSummary.projectName}</TagLabel>
                                </Tag>
                                <Tag colorScheme="teal">
                                  <TagLabel>{analysisSummary.locationName}</TagLabel>
                                </Tag>
                              </Box>
                            </Box>

                            {/* View Button */}
                            <Flex justify="flex-end" mt={{ base: 4, md: 8 }} >
                              <Button
                                colorScheme="green"
                                variant="solid"
                                backgroundColor="dark_green.800"
                                _hover={{ backgroundColor: "light_green.400" }}
                                color="white"
                                width="auto"
                                borderRadius="0px"
                                h={10}
                                onClick={() => handleViewClick(analysis)}
                              >
                                View
                              </Button>

                              <Button
                                colorScheme="red"
                                variant="solid"
                                backgroundColor="red.500"
                                _hover={{ backgroundColor: "light_green.400" }}
                                color="white"
                                width="auto"
                                borderRadius="0px"
                                h={10}
                                onClick={() => setIsConfirmDeleteOpen(true)}
                              >
                                Delete
                              </Button>

                              <ConfirmDeleteDialog 
                                isOpen={isConfrimDeleteOpen}
                                onClose={onConfirmDeleteClose}
                                onConfirm={() => handleDelete(analysis?.id)}
                                title="Delete Dashboard"
                                description="Are you sure you want to delete this analysis? This action will remove it from any dashboard it is associated with."
                              />

                            </Flex>
                          </Flex>
                        </CardBody>
                      </Card>
                    );
                  }
                )
              )
            }
            {paginatedData?.length === 4 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
            )}
            </Box>

            <CreateDashboardModal
              onClose={() => setCreateDashboard(false)}
              selectedAnalysis={selectedAnalysis}
              onSave={handleSave}
              isOpen={isCreateDashboardOpen}
            />

            {/* Right Sidebar */}
            <AnalysisSideBar isOpen={isOpen} onClose={onClose} selectedAnalysis={viewAnalysis} />
          </Box>
        </Flex>
      </Box>
    </>
  );
}  
