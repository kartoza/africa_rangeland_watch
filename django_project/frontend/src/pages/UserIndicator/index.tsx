import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Heading, Flex, Button, Text, Divider, Tag, TagLabel, Card, CardBody } from "@chakra-ui/react";
import { FaEye, FaTrashAlt } from "react-icons/fa";
import { AppDispatch } from "../../store";
import Helmet from "react-helmet";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import "../../styles/index.css";
import Pagination from "../../components/Pagination";
import {UserIndicatorFormData, fetchUserIndicator} from "../../store/userIndicatorSlice";


export default function UserIndicator() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [currentUserIndicators, setCurrentUserIndicators] = useState([]);
  
  const { data, loading, error } = useSelector((state: any) => state.userIndicator);

  useEffect(() => {
    dispatch(fetchUserIndicator());
  }, [dispatch]);

  const itemsPerPage = 4;
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = currentPage * itemsPerPage;
    setCurrentUserIndicators(data.slice(startIndex, endIndex));
  }, [data, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleView = (item: UserIndicatorFormData) => {
    // dispatch(setLayerId({layer_id: layer.layer_id, layer_name: layer.name}));
    console.log(item);
    // TODO: handle view item (readonly)
  };

  const handleDelete = (id: number) => {
    // dispatch(deleteLayer(uuid));
    // TODO: Handle delete
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options); // Formats the date like "27 March 2025"
  };

  return (
    <>
  <Helmet>
    <title>View User Indicators</title>
    <meta name="description" content="View user indicators." />
  </Helmet>

  <Header />

  <Box bg="white" w="100%">
    <Flex direction={{ base: "column", md: "row" }} gap="30px" alignItems="start">
      {/* Sidebar */}
      <Sidebar display={{ base: "none", md: "flex" }} />

      {/* Main Content */}
      <Box flex="1" ml={{ base: "35px", md: "0px" }} mt={{ base: "15px", md: "20px" }} width={{ base: "auto", md: "auto" }} overflow={"hidden"}>
        <Heading size="lg" mb={6} color="black">
          User Indicators
        </Heading>

        {/* Search & Action Row */}
        <Flex justify="space-between" align="center" mb={6} direction={{ base: "column", md: "row" }}>

          {/* New Add User Indicator Button */}
          <Box display="flex" gap={2} width={{ base: "100%", md: "auto" }} mb={{ base: 4, md: "0" }} flexDirection={{ base: "column", md: "row" }}>
            <Button minWidth={150} h={10} borderRadius="5px"  colorScheme="orange_a200" size="sm" onClick={() => navigate("/user-indicator/create")}>
              Add New User Indicator
            </Button>
          </Box>
        </Flex>

        {/* Content Section */}
        <Divider mb={6} borderColor="black" borderWidth="1px" mt={4}/>

        {loading && <Text>Loading...</Text>}
        {error && <Text>{error}</Text>}

        {/* Display user-defined layers */}
        <Box maxHeight="calc(100vh - 250px)" overflowY="hidden" mb={6} display="flex" flexDirection="column" gap={4}>
          {currentUserIndicators.length === 0 ? (
            <Flex justify="center" align="center" height="200px">
              <Text fontSize="lg" fontWeight="bold" color="gray.500">
                No data available
              </Text>
            </Flex>
          ) : (
            currentUserIndicators.map((item: UserIndicatorFormData, index: number) => (
              <Card key={index} boxShadow="md" borderRadius="md" bg="gray.50">
                <CardBody>
                  <Flex direction={{ base: "column", md: "row" }} align="stretch" gap={4} justify="space-between">
                    {/* Content */}
                    <Box flex="1" display="flex" flexDirection="column" justifyContent="space-between">
                      <Heading size="md" fontWeight="bold" color="black" mb={2}>
                        {item.name || "No Name"}
                      </Heading>

                      <Text mt={2} color="black" mb={4}>
                        {item.description || "No Description Available"}
                      </Text>

                      <Box mt={4} display="flex" flexWrap="wrap" gap={2}>
                        { item.geeAssetType && (
                          <Tag colorScheme="green" mr={2}>
                            <TagLabel>{item.geeAssetType}</TagLabel>
                          </Tag>
                        )}

                        { item.analysisTypes.map((analysisType) => (
                          <Tag colorScheme="blue" mr={2} key={analysisType}>
                            <TagLabel>{analysisType}</TagLabel>
                          </Tag>
                        ))}
                        <Tag colorScheme="purple" mr={2}>
                          <TagLabel>{formatDate(item.createdDate) || "Unknown Date"}</TagLabel>
                        </Tag>
                      </Box>
                    </Box>

                    {/* Action Buttons */}
                    <Flex direction="row" justify="flex-start" gap={4} align="center">
                      <Button
                        leftIcon={<FaEye />}
                        colorScheme="green"
                        variant="solid"
                        backgroundColor="dark_green.800"
                        _hover={{ backgroundColor: "light_green.400" }}
                        color="white"
                        width="auto"
                        borderRadius="0px"
                        h={10}
                        onClick={() => handleView(item)}
                      >
                        View
                      </Button>

                      <Button
                        leftIcon={<FaTrashAlt />}
                        colorScheme="red"
                        variant="solid"
                        backgroundColor="red.500"
                        _hover={{ backgroundColor: "light_green.400" }}
                        color="white"
                        width="auto"
                        borderRadius="0px"
                        h={10}
                        onClick={() => handleDelete(item.id)}
                        display={"none"}
                      >
                        Delete
                      </Button>

                     
                    </Flex>
                  </Flex>
                </CardBody>
              </Card>
            ))
          )}
        </Box>

        {data.length >= 3 && (
          <Flex justifyContent="center" mb={5}>
            <Pagination currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
          </Flex>
        )}
      </Box>
    </Flex>
  </Box>
</>

  );
}
