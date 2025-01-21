import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Heading, Flex, Button, Text, Divider, Tag, TagLabel, Card, CardBody, Image, Input } from "@chakra-ui/react";
import { FaFilter, FaPlus } from "react-icons/fa";
import { fetchUserDefinedLayers } from "../../store/layerSlice";
import { AppDispatch } from "../../store";
import Helmet from "react-helmet";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import "../../styles/index.css";
import Pagination from "../../components/Pagination";
import SearchInput from "../../components/SearchInput";


interface Layer {
  uuid: string;
  name: string;
  description?: string;
  image?: string;
  data_provider: string;
}

export default function UploadedResults() {
  const dispatch = useDispatch<AppDispatch>();
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredLayers, setFilteredLayers] = useState<Layer[]>([]);
  const [currentLayers, setcurrentLayers] = useState([]); 
  
  
  const { layers, loading, error } = useSelector((state: any) => state.layer);



  // Fetch user-defined layers on component mount
  useEffect(() => {
    dispatch(fetchUserDefinedLayers());
  }, [dispatch]);

  useEffect(() => {
    if(!loading)
      setFilteredLayers(layers);
  }, [loading])

  const itemsPerPage = 4;
  const totalItems = layers.length
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = currentPage * itemsPerPage;
      setcurrentLayers(filteredLayers.slice(startIndex, endIndex));
    }, [filteredLayers, currentPage, itemsPerPage]);


  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <Helmet>
        <title>Uploaded Results - View Uploaded Data</title>
        <meta name="description" content="View uploaded analysis data and results." />
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
              Uploaded Results
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
                      w={{base: "100%",md:"auto"}}
                      h={10}
                      color="white.a700"
                      borderRadius="0px"
                    >
                      Filter
                    </Button>

                    {/* Search Input */}
                    {!loading && (
                      <SearchInput
                        placeholder="Search results"
                        data={layers}
                        filterKeys={["name"]}
                        onFilteredData={setFilteredLayers}
                      />
                    )}
                    
                  </Flex>
                </Box>

              {/* New Add Data Button */}
              <Box display="flex" gap={2} width={{ base: "100%", md: "auto" }} mb={{ base: 4, md: 0 }} flexDirection={{ base: "column", md: "row" }}>
                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="green"
                  variant="outline"
                  borderColor="dark_green.800"
                  textColor="dark_green.800"
                  w="auto"
                  borderRadius="0px"
                  h={10}
                >
                  Add Data
                </Button>
              </Box>
            </Flex>

            {/* Content Section */}
            <Divider mb={6} borderColor="black" borderWidth="1px" />

            {loading && <Text>Loading...</Text>}
            {error && <Text>{error}</Text>}

            {/* Display user-defined layers */}
            <Box
              maxHeight="calc(100vh - 250px)"
              overflowY="hidden"
              mb={6}
              display="flex"
              flexDirection="column"
              gap={4}
            >
               {currentLayers.map((layer: Layer, index: number) => (
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
                        src={layer.image || "https://via.placeholder.com/150"}
                        alt={layer.name}
                        borderRadius="md"
                        boxSize={{ base: "100%", md: "150px" }}
                        mb={{ base: 4, md: 0 }}
                      />
                      
                      {/* Content */}
                      <Box flex="1" display="flex" flexDirection="column" justifyContent="space-between">
                        <Heading size="md" fontWeight="bold" color="black" mb={2}>
                          {layer.name || "No Name"}
                        </Heading>
                        
                        <Text mt={2} color="black" mb={4}>
                          {layer.description || "No Description Available"}
                        </Text>
                        
                        <Box mt={4} display="flex" flexWrap="wrap" gap={2}>
                          <Tag colorScheme="green" mr={2}>
                            <TagLabel>{layer.data_provider || "Unknown"}</TagLabel>
                          </Tag>
                        </Box>
                      </Box>
                
                      {/* View Button */}
                      <Flex justify="flex-end" mt="auto">
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


              
              
            </Box>
            {filteredLayers.length >= 3 && (
                  <Flex justifyContent="center" mb={5}>
                      <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          handlePageChange={handlePageChange} />
                  </Flex>
                )}
          </Box>
        </Flex>
      </Box>
    </>
  );
}
