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
  Image
} from "@chakra-ui/react";
import { FaFilter } from "react-icons/fa";
import { format } from 'date-fns';
import Header from "../../components/Header";
import { Helmet } from "react-helmet";
import Footer from "../../components/Footer";
import AllDashboardList from "../../components/DashboardList";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store";
import { fetchDashboards, deleteDashboard } from "../../store/dashboardSlice";
import DashboardFilters from "../../components/DashboardFilters";
import CreateDashboardModal from "../../components/CreateDashboard";
import Pagination from "../../components/Pagination";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";
import Sidebar from "../../components/SideBar";


interface DashboardListProps {
  allDashboards: boolean;
}

const DashboardListPage: React.FC<DashboardListProps> = ({allDashboards}) => {
  const navigate = useNavigate();
  const hash = useLocation().hash;
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [filters, setFilters] = useState({
    my_dashboards: !allDashboards
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isCreateDashboardOpen, setCreateDashboard] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const dashboardData = useSelector((state: any) => state.dashboard.dashboards);
  const loading = useSelector((state: any) => state.dashboard.loading);
  const error = useSelector((state: any) => state.dashboard.error);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const isEditable = !allDashboards;
  const itemsPerPage = allDashboards ? 12 : 4;

  // SEARCH FUNCTION
  const filteredData = dashboardData.filter((chartConfig: any) =>
      typeof chartConfig.title !== 'undefined' ? chartConfig.title.toLowerCase().includes(searchTerm.toLowerCase()) : false
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedData = filteredData.slice(startIdx, endIdx);
  const toast = useToast();

  const handleFilterClick = () => {
    isOpen ? onClose() : onOpen();
  };

  useEffect(() => {
    dispatch(fetchDashboards(filters));
  }, [dispatch, filters]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemClick = (dashboard: any) => {
    const basePath = allDashboards ? '/dashboard' : '/my-dashboard';
    navigate(`${basePath}/${dashboard.uuid}`);
  }

  const handleDelete = async (uuid: string) => {
    const resultAction = await dispatch(deleteDashboard(uuid));
    if (deleteDashboard.fulfilled.match(resultAction)) {
        toast({
          title: 'Dashboard Deleted',
          description: 'Dashboard has been deleted successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: "top-right",
          containerStyle: {
            backgroundColor: "#00634b",
            color: "white",
          },
        });
        setIsConfirmDeleteOpen(false);
    }
  }

  const onDashboardCreated = (uuid: string) => {
    setCreateDashboard(false);
    if (uuid) {
      navigate(`/my-dashboard/${uuid}`);
    }
  }

  return (
    <>
      <Box width="100%" minHeight={{base: "auto", md:"80vh"}}>
        <Helmet>
          <title>Dashboard | Africa Rangeland Watch | Sustainable Management</title>
          <meta name="description" content="dashboard data." />
        </Helmet>

        <Header />

        <Flex direction={{ base: "column", md: "row" }} align="start" gap="30px">
          {/* left-hand column: sidebar (only on /my-dashboard) */}
          {!allDashboards && (
            <Box
              display={{ base: "none", md: "block" }}
              w="286px"
              flexShrink={0}
            >
              <Sidebar w="full" />
            </Box>
          )}

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
                    onClick={() => setCreateDashboard(true)}
                  >
                    New
                  </Button>
                </Flex>
            </Flex>
          

            {/* Content Section */}
            <Divider mb={6} borderColor="black" borderWidth="1px" mt={4}/>

            {loading && <Text>Loading...</Text>}
            {!loading && !filteredData?.length && <Text>No dashboard available.</Text>}
            {error && <Text>{error}</Text>}
        
            {/* Dashboard List Component */}
            {
              allDashboards ? 
              <AllDashboardList
                paginatedData={paginatedData}
                filteredData={filteredData}
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                handlePageChange={handlePageChange}
                handleItemClick={handleItemClick}
              /> : 
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
                      paginatedData?.map((dashboard: any, index: number) => {
                        return (
                          <Card key={index} boxShadow="md" borderRadius="md" bg="gray.50" _hover={{ boxShadow: "lg" }} transition="box-shadow 0.2s ease" cursor={"pointer"}>
                            <CardBody>
                              <Flex
                                direction={{ base: "column", md: "row" }}
                                align="stretch"
                                gap={4}
                                justify="space-between"
                              >
                                {/* Thumbnail */}
                            <Box flexShrink={0}>
                              <Image
                                src={dashboard.thumbnail} 
                                height="120px" 
                                width="200px" 
                                objectFit="cover"
                                borderRadius="md"
                                fallbackSrc="static/images/sa_map.png"
                              />
                            </Box>

                            {/* Content */}
                                <Box
                                    flex="1"
                                    display="flex"
                                    flexDirection="column"
                                    justifyContent="space-between"
                                    onClick={() => handleItemClick(dashboard)}
                                    cursor="pointer"
                                    ml={4}
                              >

                                  <Heading size="md" fontWeight="bold" color="black" mb={2}>
                                    {dashboard.title}
                                  </Heading>

                              {/* Description */}
                              <Text
                                color="gray.600" 
                                fontSize="sm" 
                                mb={3}
                                noOfLines={2}
                                flex="1"
                              >
                                {dashboard.config?.dashboardDescription || "No description available"}
                              </Text>

                                  <Box mt={4} display="flex" flexWrap="wrap" gap={2}>
                                    <Tag colorScheme="green" mr={2}>
                                      <TagLabel>
                                        {format(new Date(dashboard?.updated_at), "MMMM dd, yyyy HH:mm:ss")}
                                      </TagLabel>
                                    </Tag>
                                    <Tag colorScheme="teal">
                                      <TagLabel>{dashboard.owner_name}</TagLabel>
                                    </Tag>
                                  </Box>
                                </Box>

                                {/* View Button */}
                                { isEditable && (
                                  <Flex justify="flex-end" mt={{ base: 4, md: 8 }} >
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
                                      isOpen={isConfirmDeleteOpen}
                                      onClose={() => setIsConfirmDeleteOpen(false)}
                                      onConfirm={() => handleDelete(dashboard.uuid)}
                                      title="Delete Dashboard"
                                      description="Are you sure you want to delete this dashboard?"
                                    />
                                  </Flex>
                                )}
                              </Flex>
                            </CardBody>
                          </Card>
                        );
                      }
                    )
                  )
                }
                {filteredData?.length > itemsPerPage && (
                  <Pagination currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
                )}
                </Box>
            }

            {/* Filter Panel (Drawer) */}
            <DashboardFilters 
              isOpen={isOpen}
              onClose={onClose}
              setSearchTerm={(searchTerm) => setFilters((prev: any) => ({ ...prev, searchTerm }))}
              setFilters={setFilters}
              filters={filters}
              landscapes={[]}
            />

            {/* Create dashboard modal */}
            <CreateDashboardModal
              onClose={(uuid) => onDashboardCreated(uuid)}
              selectedAnalysis={null}
              isOpen={isCreateDashboardOpen}
            />
          </Box>
        </Flex>
        <Footer />
      </Box>
    </>
  );
}

export default DashboardListPage;
