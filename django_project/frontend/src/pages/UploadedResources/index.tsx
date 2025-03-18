import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Heading, Flex, Button, Text, Divider, Tag, TagLabel, Card, CardBody, Input, IconButton, Modal, ModalOverlay, ModalHeader, ModalCloseButton, ModalBody, ModalContent, Checkbox, Select, Collapse, SimpleGrid } from "@chakra-ui/react";
import { FaEye, FaFilter, FaTrashAlt } from "react-icons/fa";
import { deleteLayer, fetchUserDefinedLayers } from "../../store/layerSlice";
import { AppDispatch, RootState } from "../../store";
import Helmet from "react-helmet";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import "../../styles/index.css";
import Pagination from "../../components/Pagination";
import SearchInput from "../../components/SearchInput";
import { ChevronUpIcon } from "@chakra-ui/icons";
import { IoCloseSharp } from "react-icons/io5";
import DatasetUploader from "../../components/DatasetUploader";
import DatasetDownloader from "../../components/DatasetDownloader";
import { addUuid, removeUuid } from '../../store/downloadSlice';



interface Layer {
  uuid: string;
  name: string;
  description?: string;
  data_provider: string;
  layer_type: string; // New tag for layer type
  created_at: string; // New tag for creation date
}

export default function UploadedResults() {
  const dispatch = useDispatch<AppDispatch>();
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredLayers, setFilteredLayers] = useState<Layer[]>([]);
  const [currentLayers, setCurrentLayers] = useState([]);
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [layerType, setLayerType] = useState("");
  const [date, setDate] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentLayer, setCurrentLayer] = useState(null);
  const { uuid_list } = useSelector(
      (state: RootState) => state.download
  );

  
  const { layers, loading, error } = useSelector((state: any) => state.layer);
  const uniqueLayerTypes = Array.from(new Set(layers.map((layer: { layer_type: any; }) => layer.layer_type)));


  useEffect(() => {
    dispatch(fetchUserDefinedLayers());
  }, [dispatch]);

  useEffect(() => {
    if (!loading) setFilteredLayers(layers);
  }, [loading]);

  const itemsPerPage = 4;
  const totalItems = layers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = currentPage * itemsPerPage;
    setCurrentLayers(filteredLayers.slice(startIndex, endIndex));
  }, [filteredLayers, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleView = (layer: Layer) => {
    setCurrentLayer(layer);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

const handleDelete = (uuid: string) => {
  dispatch(deleteLayer(uuid));
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options); // Formats the date like "27 March 2025"
};

useEffect(() => {
  let filtered = layers;

  if (layerType) {
    filtered = filtered.filter((layer: { layer_type: string; }) => layer.layer_type === layerType);
  }

  if (date) {
    filtered = filtered.filter((layer: { created_at: string; }) => formatDate(layer.created_at) === formatDate(date));
  }

  setFilteredLayers(filtered);
}, [layerType, date, layers]); // Runs automatically when filters change

const clearFilters = () => {
  setLayerType("");
  setDate("");
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
      <Box flex="1" ml={{ base: "35px", md: "0px" }} mt={{ base: "15px", md: "20px" }} width={{ base: "auto", md: "auto" }} overflow={"hidden"}>
        <Heading size="lg" mb={6} color="black">
          User Uploads
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
                onClick={() => setFilterOpen(!isFilterOpen)}
                transition="all 0.3s ease-in-out"
              >
                {!isFilterOpen ? "Filter" : ""}
              </Button>

              {/* Search Input */}
              {!loading && (
                <SearchInput placeholder="Search results" data={layers} filterKeys={["name"]} onFilteredData={setFilteredLayers} />
              )}
            </Flex>
          </Box>

          {/* New Add Data Button and Download Button */}
          <Box display="flex" gap={2} width={{ base: "100%", md: "auto" }} mb={{ base: 4, md: "0" }} flexDirection={{ base: "column", md: "row" }}>
            <DatasetUploader buttonVariant="profileArea"/>

            {/* Download Button */}
            <DatasetDownloader buttonVariant="profileArea" />
          </Box>
        </Flex>

        <Collapse in={isFilterOpen} animateOpacity>
          <Box bg="gray.100" p={4} borderRadius="md" boxShadow="md" mt={2} width={{ base: "100%", md: "50%" }}>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="lg" fontWeight="bold" color="gray.700">
                Filter Uploads
              </Text>
              <IconButton
                icon={<IoCloseSharp />}
                size="sm"
                onClick={() => setFilterOpen(!isFilterOpen)}
                aria-label="Close filters"
                variant="ghost"
                color="gray.600"
                _hover={{ color: "red.500" }}
              />
            </Flex>
            <SimpleGrid columns={2} spacing={4}>
            {/* Layer Type Filter */}
            <Select
              placeholder="Select Layer Type"
              value={layerType}
              onChange={(e) => setLayerType(e.target.value)}
              borderColor="gray.400"
            >
              {uniqueLayerTypes.map((type, index) => (
                <option key={index} value={String(type)}> {/* Cast type to string */}
                  {String(type)}
                </option>
              ))}
            </Select>


            {/* Date Filter */}
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              borderColor="gray.400"
            />

            {/* Clear Filters Button */}
            <Button 
              onClick={clearFilters} colorScheme="teal"
              variant="outline"
              borderColor="teal.500"
              textColor="teal.600"
              fontWeight={700}
              h={8}
              width="100%"
              borderRadius="md"
              mt={2}
            >
              Clear Filters
            </Button>
            </SimpleGrid>
          </Box>
        </Collapse>



        {/* Content Section */}
        <Divider mb={6} borderColor="black" borderWidth="1px" mt={4}/>

        {loading && <Text>Loading...</Text>}
        {error && <Text>{error}</Text>}

        {/* Display user-defined layers */}
        <Box maxHeight="calc(100vh - 250px)" overflowY="hidden" mb={6} display="flex" flexDirection="column" gap={4}>
          {currentLayers.length === 0 ? (
            <Flex justify="center" align="center" height="200px">
              <Text fontSize="lg" fontWeight="bold" color="gray.500">
                No data available
              </Text>
            </Flex>
          ) : (
            currentLayers.map((layer: Layer, index: number) => (
              <Card key={index} boxShadow="md" borderRadius="md" bg="gray.50">
                <CardBody>
                  <Flex direction={{ base: "column", md: "row" }} align="stretch" gap={4} justify="space-between">
                     {/* Layer Selection Checkbox */}
                    <Checkbox
                      isChecked={uuid_list.includes(layer.uuid)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          dispatch(addUuid(layer.uuid));
                        } else {
                          dispatch(removeUuid(layer.uuid));
                        }
                      }}
                    />
                    {/* Content */}
                    <Box flex="1" display="flex" flexDirection="column" justifyContent="space-between">
                      <Heading size="md" fontWeight="bold" color="black" mb={2}>
                        {layer.name || "No Name"}
                      </Heading>

                      {/* <Text mt={2} color="black" mb={4}>
                        {layer.description || "No Description Available"}
                      </Text> */}

                      <Box mt={4} display="flex" flexWrap="wrap" gap={2}>
                        <Tag colorScheme="green" mr={2}>
                          <TagLabel>{layer.data_provider || "Unknown"}</TagLabel>
                        </Tag>
                        <Tag colorScheme="blue" mr={2}>
                          <TagLabel>{layer.layer_type || "Unknown Layer Type"}</TagLabel>
                        </Tag>
                        <Tag colorScheme="purple" mr={2}>
                          <TagLabel>{formatDate(layer.created_at) || "Unknown Date"}</TagLabel>
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
                        onClick={() => handleView(layer)}
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
                        onClick={() => handleDelete(layer.uuid)}
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

        {filteredLayers.length >= 3 && (
          <Flex justifyContent="center" mb={5}>
            <Pagination currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
          </Flex>
        )}

        <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{currentLayer?.name}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>{currentLayer?.description}</Text>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  </Box>
</>

  );
}
