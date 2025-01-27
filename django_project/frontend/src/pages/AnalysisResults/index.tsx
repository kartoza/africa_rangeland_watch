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
  Image,
  Stack,
  Tag,
  TagLabel,
  useDisclosure,
  Checkbox,
} from "@chakra-ui/react";
import { FaFilter } from "react-icons/fa";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import AnalysisSideBar from "../../components/SideBar/AnalysisSideBar";
import "../../styles/index.css";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store";
import { fetchAnalysis } from "../../store/userAnalysisSlice";
import maplibregl, { Map } from 'maplibre-gl';
import "maplibre-gl/dist/maplibre-gl.css"; 
import CreateDashboardModal from "../../components/CreateDashboard";
import { format } from 'date-fns';


export default function AnalysisResults() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isCreateDashboardOpen, setCreateDashboard] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const analysisData = useSelector((state: any) => state.userAnalysis.data);
  const loading = useSelector((state: any) => state.userAnalysis.loading);
  const error = useSelector((state: any) => state.userAnalysis.error);


  useEffect(() => {
    dispatch(fetchAnalysis());
  }, [dispatch]);

  // Filtering based on search term
  // const filteredData = analysisData.filter((analysis: { heading: string; }) =>
  //   analysis.heading.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  const handleViewClick = (analysis: any) => {
    setSelectedAnalysis(analysis);
    onOpen();
  };

  useEffect(() => {
    console.log('loading ',loading, ' analyis ',analysisData)
    if(!loading)
      console.log('data ',analysisData)
    
  }, [loading,analysisData]);


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
                    placeholder="Search tickets"
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
                >
                  New Analysis
                </Button>
              </Box>
            </Flex>
  
            {/* Content Section */}
            <Divider mb={6} borderColor="black" borderWidth="1px" />
  
            {loading && <Text>Loading...</Text>}
            {!loading && !analysisData?.length && <Text>No analysis data available.</Text>}
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
              {analysisData?.map((analysis: any, index: number) => {
                // Generate a meaningful title
                const analysisResults = analysis?.analysis_results?.results;
                const features = analysisResults?.length ? analysisResults[0]?.features : [];
                
                // Extract properties safely
                const projectName = features?.[0]?.properties?.Project || "Unknown Project";
                const locationName = features?.[0]?.properties?.Name || "Coordinates Location";
                const analysisType = analysis?.analysis_results?.data?.analysisType || "Analysis";

                // Extract coordinates safely
                const latitude = analysis?.analysis_results?.data?.latitude;
                const longitude = analysis?.analysis_results?.data?.longitude;

                // Generate a meaningful title
                const meaningfulTitle = locationName === "Coordinates Location" && projectName === "Unknown Project" 
                  ? `${analysisType} Results from Area (${latitude}, ${longitude})`
                  : projectName === "Unknown Project"
                    ? `${analysisType} Analysis of ${locationName} in the Area (${latitude}, ${longitude})`
                    : `${analysisType} Analysis of ${locationName} in the ${projectName} Landscape.`;



  
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
                        <Box flex="1" display="flex" flexDirection="column" justifyContent="space-between">

                          <Heading size="md" fontWeight="bold" color="black" mb={2}>
                            {meaningfulTitle}
                          </Heading>
  
                          <Box mt={4} display="flex" flexWrap="wrap" gap={2}>
                            <Tag colorScheme="green" mr={2}>
                              <TagLabel>
                                {format(new Date(analysis?.created_at), "MMMM dd, yyyy HH:mm:ss")}
                              </TagLabel>
                            </Tag>
                            <Tag colorScheme="blue" mr={2}>
                              <TagLabel>{projectName}</TagLabel>
                            </Tag>
                            <Tag colorScheme="teal">
                              <TagLabel>{locationName}</TagLabel>
                            </Tag>
                          </Box>
                        </Box>
  
                        {/* View Button */}
                        <Flex justify="flex-end" mt={{ base: 4, md: 8 }}>
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
                        </Flex>
                      </Flex>
                    </CardBody>
                  </Card>
                );
              })}
            </Box>
  
            <CreateDashboardModal
              onClose={() => setCreateDashboard(false)}
              selectedAnalysis={selectedAnalysis} // Pass selected analysis data to the modal
              onSave={handleSave}
              isOpen={isCreateDashboardOpen}
            />
  
            {/* Right Sidebar */}
            <AnalysisSideBar isOpen={isOpen} onClose={onClose} selectedAnalysis={selectedAnalysis} />
          </Box>
        </Flex>
      </Box>
    </>
  );
}  