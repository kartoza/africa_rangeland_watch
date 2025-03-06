import React, { useState } from "react";
import Helmet from "react-helmet";
import {
  Box,
  Heading,
  Flex,
  Input,
  Table,
  Tbody,
  Tr,
  Td,
  Thead,
  Button,
  Badge,
  IconButton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Divider,
  Text
} from "@chakra-ui/react";
import { FaPlus, FaTrash } from "react-icons/fa";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import "../../styles/index.css";
import { useSelector, useDispatch } from "react-redux";
import { deleteMember, fetchOrganizations } from "../../store/organizationSlice";
import { AppDispatch } from "../../store";
import InviteMember from "../../components/inviteMembers";
import { selectRefetch }  from "../../store/organizationSlice";
import Pagination from "../../components/Pagination";


export default function OrganisationInformation() {
  const dispatch = useDispatch<AppDispatch>();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedOrgKey, setSelectedOrgKey] = useState<string | null>(null);
  const refetch = useSelector(selectRefetch);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentInvitationPage, setCurrentInvitationPage] = useState(1);
  const itemsPerPage = 5;


  const openInviteModal = () => {
    setIsInviteModalOpen(true);
  };

  const closeInviteModal = () => {
    setIsInviteModalOpen(false);
  };

  // Get data from the store
  const { organizations, loading, error } = useSelector((state: any) => state.organization);
  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(() => {
    if (refetch) {
      dispatch(fetchOrganizations());
    } 
  }, [dispatch, refetch]); 

  React.useEffect(() => {
      dispatch(fetchOrganizations());
  }, [dispatch]);

  React.useEffect(() => {
    const orgKeys = Object.keys(organizations);
    if (orgKeys.length === 1) {
      setSelectedOrgKey(orgKeys[0]);
    }
  }, [organizations]);

  // Filter members based on search term
  const filteredMembers = (members: any[]) => {
    if (!Array.isArray(members) || members.length === 0) return [];
    if (!searchTerm) return members;
    return members.filter(
      (member) =>
        member.user__email &&
        member.user__email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  

  const handleDelete = async (orgKey: any, user: any) => {
    try {
      dispatch(deleteMember({ orgKey, user: user.user__email })).unwrap();
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  // Check if selectedOrgKey is set and the organization data is available
  const orgKeys = Object.keys(organizations);
  if (!selectedOrgKey && orgKeys.length > 0) {
    setSelectedOrgKey(orgKeys[0]);
  }

  // Check if selectedOrgKey is set and the organization data is available
  const members = selectedOrgKey
    ? organizations[selectedOrgKey]?.members || []
    : []; // Default to empty if no selectedOrgKey

  const filteredMembersList = filteredMembers(members);

  // Only calculate paginated members if the data is available
  const paginatedMembers = filteredMembersList.length > 0 
    ? filteredMembersList.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleInvitationPageChange = (page: number) => {
    setCurrentInvitationPage(page);
  };

  const invitations = selectedOrgKey
  ? organizations[selectedOrgKey]?.invitations || []
  : []; // Default to empty if no selectedOrgKey

  // Only calculate paginated invitations if the data is available
  const paginatedInvitations = invitations.length > 0
    ? invitations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : [];

  return (
    <>
      <Helmet>
        <title>Organisation Information - Manage Organisation Details</title>
        <meta
          name="description"
          content="Manage your organisation's information, members, and invitations."
        />
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
              My Organisations
            </Heading>

            {loading && <p>Loading...</p>}

            {Object.keys(organizations).length === 0 ? (
              <Flex justify="center" align="center" height="200px">
                <Text fontSize="lg" fontWeight="bold" color="gray.500">
                  No data available
                </Text>
              </Flex>
            ) : (
              <Tabs variant="unstyled">
                <Box
                  width="fit-content"
                  border="1px solid"
                  borderColor="gray.300"
                  borderBottom="none"
                  borderRadius="5px"
                  overflow="hidden"
                >
                  <TabList>
                    {Object.keys(organizations).map((orgKey, idx) => (
                      <Tab
                        key={idx}
                        _selected={{ color: "white", bg: "dark_green.800" }}
                        _hover={{ bg: "light_green.400" }}
                        px={6}
                        py={2}
                        onClick={() => setSelectedOrgKey(orgKey)}
                      >
                        {orgKey}
                      </Tab>
                    ))}
                  </TabList>
                </Box>

                <Divider mb={6} borderColor="black" borderWidth="1px" width={{ base: "auto", md: "99%" }} />

                <TabPanels>
                  {Object.values(organizations).map((organization: any, index: number) => (
                    <TabPanel key={index}>
                      {/* Organisation Members Section */}
                      <Heading size="md" mb={4} color="black">
                        Organisation Members
                      </Heading>
                      <Flex align="center" mb={4} justify="space-between">
                        <Flex align="center" w="auto" position="relative">
                          <Input
                            placeholder="Search organisation members"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            borderColor="gray.400"
                            mr={2}
                            w={{ base: "full", md: 80 }}
                          />
                        </Flex>
                        
                        {organization.is_manager && (
                        <>
                          <Button
                            leftIcon={<FaPlus />}
                            colorScheme="green"
                            variant="solid"
                            backgroundColor="dark_green.800"
                            _hover={{ backgroundColor: "light_green.400" }}
                            fontWeight={700}
                            w="auto"
                            h={10}
                            color="white.a700"
                            borderRadius="0px"
                            onClick={openInviteModal}
                          >
                            Add People
                          </Button>
                          <InviteMember 
                            isOpen={isInviteModalOpen} 
                            onClose={closeInviteModal} 
                            orgKey={organization.org_id}
                            organizationName={selectedOrgKey || "Unknown"} 
                          />
                        </>
                        )}
                      </Flex>

                      <Divider mb={6} borderColor="black" borderWidth="1px" />

                      <Box overflowX="auto">
                        <Table variant="unstyled" size="sm">
                          <Thead borderBottom="1px solid" borderColor="gray.400">
                            <Tr>
                              <Td fontWeight="bold">User</Td>
                              <Td fontWeight="bold">Role</Td>
                              <Td fontWeight="bold" textAlign="center">Actions</Td>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {paginatedMembers.map((member: any, idx: number) => (
                              <Tr key={idx}>
                                <Td color={"black"}>{member.user_profile__user__email}</Td>
                                <Td color={"black"}>{member.user_type}</Td>
                                {organization.is_manager && (
                                <>
                                  <Td textAlign="center" display="flex" justifyContent="center">
                                    <IconButton
                                      aria-label="Delete member"
                                      icon={<FaTrash />}
                                      colorScheme="red"
                                      variant="ghost"
                                      onClick={() => handleDelete(organization.org_id, member)}
                                    />
                                  </Td>
                                </>
                                )}
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                        {filteredMembersList.length > 5 && (
                          <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(filteredMembersList.length / itemsPerPage)}
                            handlePageChange={handlePageChange}
                          />
                        )}
                      </Box>


                    {organization.is_manager && (
                      <>
                        <Heading size="md" mt={8} mb={4} color="black">
                          Invitations
                        </Heading>

                        <Divider mb={6} borderColor="black" borderWidth="1px" />

                        <Box overflowX="auto">
                          <Table variant="unstyled" size="sm">
                            <Thead borderBottom="1px solid" borderColor="gray.400">
                              <Tr>
                                <Td fontWeight="bold">Email</Td>
                                <Td fontWeight="bold">Status</Td>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {paginatedInvitations.map((invite: any, idx: number) => (
                                <Tr key={idx}>
                                  <Td>{invite.invitation__email}</Td>
                                  <Td>
                                    <Badge
                                      backgroundColor={
                                        invite.accepted
                                          ? "light_green.400"
                                          : "#3e3e3e"
                                      }
                                      color="white"
                                      variant="solid"
                                      px={4}
                                      py={2}
                                      borderRadius="full"
                                    >
                                      {invite.accepted ? "Joined": "Pending"}
                                    </Badge>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                          {paginatedInvitations.length > 5 && (
                             <Pagination
                              currentPage={currentInvitationPage}
                              totalPages={Math.ceil(paginatedInvitations.length / itemsPerPage)}
                              handlePageChange={handleInvitationPageChange}
                            />
                          )}
                        </Box>
                    </>
                    )}
                    </TabPanel>
                  ))}
                </TabPanels>
              </Tabs>
            )}
          </Box>
        </Flex>
      </Box>
    </>
  );
}
