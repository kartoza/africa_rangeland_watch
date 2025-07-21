import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  useDisclosure,
  useToast,
  Divider,
  Card,
  CardBody,
  Tag,
  TagLabel,
  Heading,
  Badge,
  ButtonGroup,
  IconButton
} from "@chakra-ui/react";
import axios from 'axios';
import { FaFilter, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { format } from 'date-fns';
import Header from "../../components/Header";
import { Helmet } from "react-helmet";
import Footer from "../../components/Footer";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store";
import Pagination from "../../components/Pagination";
import EarthRangerCreateUpdateModal from "../../components/EarthRangers/CreateUpdateModal";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";
import Sidebar from "../../components/SideBar";

interface EarthRangerSetting {
  id: string;
  name: string;
  url: string;
  token: string;
  privacy: 'public' | 'private';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner_name?: string;
}

const EarthRangerSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [settings, setSettings] = useState<EarthRangerSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Modal states
  const { isOpen: isCreateEditOpen, onOpen: onCreateEditOpen, onClose: onCreateEditClose } = useDisclosure();
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<EarthRangerSetting | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    token: '',
    privacy: 'private' as 'public' | 'private',
    is_active: true
  });

  const itemsPerPage = 4;
  const toast = useToast();

  // SEARCH FUNCTION
  const filteredData = settings.filter((setting) =>
    setting.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setting.url.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedData = filteredData.slice(startIdx, endIdx);

  // Mock data - replace with actual API calls
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await axios.get('/earthranger/settings/');
      const data = await response.data;
      setSettings(data.results);
      
    } catch (err) {
      setError('Failed to fetch EarthRanger settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleView = (setting: EarthRangerSetting) => {
    // TODO: Navigate to EarthRanger data view page
    // navigate(`/earthranger/view/${setting.id}`);
    navigate(`/earthranger/settings/${setting.id}/events/`);
  };

  const handleEdit = (setting: EarthRangerSetting) => {
    console.log(setting.id);
    setSelectedSetting(setting);
    setFormData({
      name: setting.name,
      url: setting.url,
      token: setting.token,
      privacy: setting.privacy,
      is_active: setting.is_active
    });
    setIsEditMode(true);
    onCreateEditOpen();
  };

  const handleAdd = () => {
    setSelectedSetting(null);
    setFormData({
      name: '',
      url: '',
      token: '',
      privacy: 'private',
      is_active: true
    });
    setIsEditMode(false);
    onCreateEditOpen();
  };

  const handleDelete = async (setting: EarthRangerSetting) => {
    setSelectedSetting(setting);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedSetting) return;
    
    try {
      axios.delete(`/earthranger/settings/${selectedSetting.id}/`);
      
      setSettings(prev => prev.filter(s => s.id !== selectedSetting.id));
      
      toast({
        title: 'Setting Deleted',
        description: 'EarthRanger setting has been deleted successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: "top-right",
        containerStyle: {
          backgroundColor: "#00634b",
          color: "white",
        },
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete EarthRanger setting',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsConfirmDeleteOpen(false);
      setSelectedSetting(null);
    }
  };

  const handleSubmit = async () => {
    try {
      if (isEditMode && selectedSetting) {
        const response = await axios.put(`/earthranger/settings/${selectedSetting.id}/`, formData);
        
        setSettings(prev => prev.map(s => 
          s.id === selectedSetting.id 
            ? { ...s, ...formData, updated_at: new Date().toISOString() }
            : s
        ));
        
        toast({
          title: 'Setting Updated',
          description: 'EarthRanger setting has been updated successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: "top-right",
          containerStyle: {
            backgroundColor: "#00634b",
            color: "white",
          },
        });
      } else {
        const response = await axios.post('/earthranger/settings/', formData);
        
        const newSetting: EarthRangerSetting = {
          id: response.data.id,
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner_name: 'Current User'
        };
        
        setSettings(prev => [newSetting, ...prev]);
        
        toast({
          title: 'Setting Created',
          description: 'EarthRanger setting has been created successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: "top-right",
          containerStyle: {
            backgroundColor: "#00634b",
            color: "white",
          },
        });
      }
      
      onCreateEditClose();
    } catch (err) {
      // Extract and format error messages
      let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} EarthRanger setting`;
      
      if (err.response?.data) {
        const errors = err.response.data;
        const errorMessages: string[] = [];
        
        // Handle field-specific errors
        Object.keys(errors).forEach(field => {
          const fieldErrors = errors[field];
          if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach(error => {
              errorMessages.push(`${field}: ${error}`);
            });
          } else if (typeof fieldErrors === 'string') {
            errorMessages.push(`${field}: ${fieldErrors}`);
          }
        });
        
        // Handle non_field_errors
        if (errors.non_field_errors && Array.isArray(errors.non_field_errors)) {
          errors.non_field_errors.forEach((error: string) => {
            errorMessages.push(error);
          });
        }
        
        // Handle detail error (common in DRF)
        if (errors.detail && typeof errors.detail === 'string') {
          errorMessages.push(errors.detail);
        }
        
        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join('; ');
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000, // Longer duration for error messages
        isClosable: true,
        position: "top-right",
      });
    }
  };

  return (
    <>
      <Box width="100%" minHeight={{base: "auto", md:"80vh"}}>
        <Helmet>
          <title>EarthRanger Settings | Africa Rangeland Watch</title>
          <meta name="description" content="Manage EarthRanger settings and configurations." />
        </Helmet>

        <Header />

        <Flex direction={{ base: "column", md: "row" }} align="start" gap="30px">
          {/* Sidebar */}
          <Box
            display={{ base: "none", md: "block" }}
            w="286px"
            flexShrink={0}
          >
            <Sidebar w="full" />
          </Box>

          <Box flex="1" overflow="auto">
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

              {/* Search and New Button */}
              <Flex
                alignItems="center"
                gap="4"
                flexDirection={{ base: "column", md: "row" }}
                w={{ base: "100%", md: "40%" }}
                justifyContent={{ base: "flex-start", md: "flex-end" }}
              >
                <Input
                  placeholder="Search settings..."
                  w={{ base: "100%", md: "400px" }}
                  size="md"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  borderRadius="md"
                />
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
                  onClick={handleAdd}
                >
                  New
                </Button>
              </Flex>
            </Flex>

            {/* Content Section */}
            <Divider mb={6} borderColor="black" borderWidth="1px" mt={4}/>

            {loading && <Text>Loading...</Text>}
            {!loading && !filteredData?.length && <Text>No EarthRanger settings available.</Text>}
            {error && <Text color="red.500">{error}</Text>}

            {/* Settings List */}
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
                paginatedData?.map((setting: EarthRangerSetting, index: number) => (
                  <Card key={index} boxShadow="md" borderRadius="md" bg="gray.50" _hover={{ boxShadow: "lg" }} transition="box-shadow 0.2s ease">
                    <CardBody>
                      <Flex
                        direction={{ base: "column", md: "row" }}
                        align="stretch"
                        gap={4}
                        justify="space-between"
                      >
                        {/* Content */}
                        <Box
                          flex="1"
                          display="flex"
                          flexDirection="column"
                          justifyContent="space-between"
                        >
                          <Heading size="md" fontWeight="bold" color="black" mb={2}>
                            {setting.name}
                          </Heading>

                          {/* URL */}
                          <Text color="gray.600" fontSize="sm" mb={2}>
                            <strong>URL:</strong> {setting.url}
                          </Text>

                          {/* Token (masked) */}
                          <Text color="gray.600" fontSize="sm" mb={3}>
                            <strong>Token:</strong> {setting.token.substring(0, 10)}...
                          </Text>

                          <Box mt={4} display="flex" flexWrap="wrap" gap={2} alignItems="center">
                            <Tag colorScheme="green" mr={2}>
                              <TagLabel>
                                {format(new Date(setting.updated_at), "MMMM dd, yyyy HH:mm:ss")}
                              </TagLabel>
                            </Tag>
                            <Tag colorScheme="teal">
                              <TagLabel>{setting.owner_name}</TagLabel>
                            </Tag>
                            <Badge colorScheme={setting.privacy === 'public' ? 'blue' : 'purple'}>
                              {setting.privacy}
                            </Badge>
                            <Badge colorScheme={setting.is_active ? 'green' : 'red'}>
                              {setting.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </Box>
                        </Box>

                        {/* Action Buttons */}
                        <Flex justify="flex-end" mt={{ base: 4, md: 0 }} align="center">
                          <ButtonGroup spacing={2}>
                            <IconButton
                              aria-label="View"
                              icon={<FaEye />}
                              colorScheme="blue"
                              variant="solid"
                              size="sm"
                              onClick={() => handleView(setting)}
                            />
                            <IconButton
                              aria-label="Edit"
                              icon={<FaEdit />}
                              colorScheme="yellow"
                              variant="solid"
                              size="sm"
                              onClick={() => handleEdit(setting)}
                            />
                            <IconButton
                              aria-label="Delete"
                              icon={<FaTrash />}
                              colorScheme="red"
                              variant="solid"
                              size="sm"
                              onClick={() => handleDelete(setting)}
                            />
                          </ButtonGroup>
                        </Flex>
                      </Flex>
                    </CardBody>
                  </Card>
                ))
              )}
              
              {filteredData?.length > itemsPerPage && (
                <Pagination currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
              )}
            </Box>

            <EarthRangerCreateUpdateModal
              isOpen={isCreateEditOpen}
              onClose={onCreateEditClose}
              isEditMode={isEditMode}
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
            />
            {/* Delete Confirmation Dialog */}
            <ConfirmDeleteDialog 
              isOpen={isConfirmDeleteOpen}
              onClose={() => setIsConfirmDeleteOpen(false)}
              onConfirm={confirmDelete}
              title="Delete EarthRanger Setting"
              description={`Are you sure you want to delete "${selectedSetting?.name}"? This action cannot be undone.`}
            />
          </Box>
        </Flex>
        <Footer />
      </Box>
    </>
  );
}

export default EarthRangerSettingsPage;
