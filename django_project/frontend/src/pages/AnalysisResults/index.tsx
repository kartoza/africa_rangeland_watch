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
} from "@chakra-ui/react";
import { FaFilter } from "react-icons/fa";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import "../../styles/index.css";

export default function AnalysesResults() {
  const [searchTerm, setSearchTerm] = useState("");
  const [analysisData, setAnalysisData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Filtering based on search term
  const filteredData = analysisData.filter((analysis) =>
    analysis.heading.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        setLoading(true);
        setError(null);
        // to replace with actual api TODO
        // const response = await fetch("/api/analyses"); 
        // if (!response.ok) throw new Error("Failed to fetch data");
        // const data = await response.json();
        // setAnalysisData(data);
        
        // Simulating successful data fetch
        setAnalysisData([]);
      } catch (err: any) {
        setError("No data available.");
        setAnalysisData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisData();
  }, []);

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
              {/* Filter Button */}
              <Box width={{ base: "100%", md: "auto" }} mb={{ base: 4, md: 0 }} mr={{ md: 2 }}>
                <Button
                    leftIcon={<FaFilter />}
                    colorScheme="green"
                    variant="solid"
                    backgroundColor="dark_green.800"
                    _hover={{ backgroundColor: "light_green.400" }}
                    fontWeight={700}
                    w="auto"
                    h={10}
                    color="white.a700"
                    borderRadius="0px"
                  >
                    Filter
                  </Button>
              </Box>

              {/* Search Field */}
              <Box width={{ base: "100%", md: "50%" }} mb={{ base: 4, md: 0 }} ml={{ md: "0px" }}>
                <Input
                  placeholder="Search analysis"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  borderColor="gray.400"
                  width="100%"
                />
              </Box>

              {/* Create Dashboard and New Analysing Buttons */}
              <Box display="flex" gap={2} width={{base: "100%" ,md:"auto"}} mb={{ base: 4, md: 0 }} flexDirection={{ base: "column", md: "row" }}>
                <Button
                  colorScheme="green"
                  variant="outline"
                  borderColor="dark_green.800"
                  textColor="dark_green.800"
                  w="auto"
                  borderRadius="0px"
                  h={10}
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
                  New Analysing
                </Button>
              </Box>

            </Flex>

            {/* Content Section */}
            <Divider mb={6} borderColor="black" borderWidth="1px" />

            {loading && <Text>Loading...</Text>}
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
              {(showAll ? filteredData : filteredData.slice(0, 5)).map((analysis, index) => (
                <Card key={index} boxShadow="md" borderRadius="md">
                  <CardBody>
                    <Flex
                      direction={{ base: "column", md: "row" }}
                      align="stretch" 
                      gap={4}
                      justify="space-between"
                    >
                      {/* Image */}
                      <Image
                        src={analysis.image}
                        alt={analysis.heading}
                        borderRadius="md"
                        boxSize={{ base: "100%", md: "150px" }}
                        mb={{ base: 4, md: 0 }}
                      />
                      
                      {/* Content */}
                      <Box flex="1" display="flex" flexDirection="column" justifyContent="space-between">
                        <Heading size="md" fontWeight="bold" color="black" mb={2}>
                          {analysis.heading}
                        </Heading>
                        
                        <Text mt={2} color="black" mb={4}>
                          {analysis.description}
                        </Text>
                        
                        <Box mt={4} display="flex" flexWrap="wrap" gap={2}>
                          <Tag colorScheme="green" mr={2}>
                            <TagLabel>{analysis.owner}</TagLabel>
                          </Tag>
                          <Tag colorScheme="blue" mr={2}>
                            <TagLabel>{analysis.publication}</TagLabel>
                          </Tag>
                          <Tag colorScheme="teal">
                            <TagLabel>{analysis.source}</TagLabel>
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
                        >
                          View
                        </Button>
                      </Flex>
                    </Flex>
                  </CardBody>
                </Card>
              ))}

              {/* View All Button */}
              {!showAll && filteredData.length > 5 && (
                <Flex justify="flex-end" width="100%" mt={4}>
                  <Button
                    colorScheme="green"
                    variant="outline"
                    onClick={() => setShowAll(true)}
                    width="auto"
                    borderRadius="0px"
                    h={10}
                  >
                    View All
                  </Button>
                </Flex>
              )}
            </Box>
          </Box>
        </Flex>
      </Box>
    </>
  );
}
