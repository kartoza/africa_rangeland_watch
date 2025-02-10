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
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
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
import Pagination from "../../components/Pagination";

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

interface AnalysisData {
  analysis_results?: AnalysisResults;
}

interface AnalysisSummary {
  title: string;
  projectName: string;
  locationName: string;
  analysisType: string;
  latitude?: number;
  longitude?: number;
}

export default function AnalysisResults() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;


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
  

  const getAnalysisSummary = (analysis: AnalysisData): AnalysisSummary => {
    const { analysis_results } = analysis || {};
    const { results, data } = analysis_results || {};

    const features = results?.[0]?.features || [];
    const { analysisType = "Analysis", latitude, longitude } = data || {};

    // Extract properties safely
    const projectName = features?.[0]?.properties?.Project || "Unknown Project";
    const locationName = features?.[0]?.properties?.Name || "Coordinates Location";

    // Construct a meaningful title
    const title =
      locationName === "Coordinates Location" && projectName === "Unknown Project"
        ? `${analysisType} Results from Area`
        : projectName === "Unknown Project"
          ? `${analysisType} Analysis of ${locationName} in the Area`
          : `${analysisType} Analysis of ${locationName} in the ${projectName} Landscape.`;

    return {
      title,
      projectName,
      locationName,
      analysisType,
      latitude,
      longitude,
    };
  };

  // Filtering based on search term
  const filteredData = analysisData.filter((analysis: AnalysisData) =>
      getAnalysisSummary(analysis).title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewClick = (analysis: any) => {
    console.log('analysis to show ',analysis)
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
    // Open the Create Dashboard modal
    setCreateDashboard(true);
  };
  
  function handleSave(): void {
    throw new Error("Function not implemented.");
  }

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
            ml={{ base: "55px", md: "0px" }}
            mt={{ base: "0px", md: "20px" }}
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
                      disabled
                    leftIcon={<FaFilter />}
                    colorScheme="green"
                    variant="solid"
                    backgroundColor="dark_green.800"
                    _hover={{ backgroundColor: "light_green.400" }}
                    fontWeight={700}
                    w={{ base: "100%", md: "auto" }}
                    h={10}
                    color="white.a700"
                    borderRadius="0px"
                  >
                    Filter
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

            {/* Content Section */}
            <Divider mb={6} borderColor="black" borderWidth="1px" width="calc(100% - 10px)" />

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
              {paginatedData?.map((analysis: any, index: number) => {
                let analysisSummary = getAnalysisSummary(analysis)

                return (
                  <Card key={index} boxShadow="md" borderRadius="md">
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

                          <AlertDialog
                            isOpen={isConfrimDeleteOpen}
                            leastDestructiveRef={cancelRef}
                            onClose={onConfirmDeleteClose}
                          >
                            <AlertDialogOverlay bg="rgba(0, 0, 0, 0.4)">
                              <AlertDialogContent bg="white">
                                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                                  Delete Analysis
                                </AlertDialogHeader>

                                <AlertDialogBody>
                                  Are you sure you want to delete this analysis? This action will remove it from any dashboard it is associated with.
                                </AlertDialogBody>

                                <AlertDialogFooter>
                                  <Button 
                                    backgroundColor="darkorange"
                                    _hover={{ backgroundColor: "dark_orange.800" }}
                                    color="white"
                                    w="auto"
                                    borderRadius="px"
                                    ref={cancelRef} 
                                    onClick={onConfirmDeleteClose}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    colorScheme="red"
                                    variant="solid"
                                    backgroundColor="red.500"
                                    _hover={{ backgroundColor: "light_green.400" }}
                                    color="white"
                                    width="auto"
                                    borderRadius="5px"
                                    onClick={() => handleDelete(analysis?.id)} ml={3}>
                                    Yes, Delete
                                  </Button>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialogOverlay>
                          </AlertDialog>

                        </Flex>
                      </Flex>
                    </CardBody>
                  </Card>
                );
              })}
               <Pagination currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
            </Box>

            <CreateDashboardModal
              onClose={() => setCreateDashboard(false)}
              selectedAnalysis={selectedAnalysis} // Pass selected analysis data to the modal
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