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
} from "@chakra-ui/react";
import { FaPlus, FaTrash } from "react-icons/fa";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import "../../styles/index.css";
import { useSelector, useDispatch } from "react-redux";
import { deleteMember, fetchOrganizations } from "../../store/organizationSlice";
import { AppDispatch } from "../../store";
import InviteMember from "../../components/inviteMembers";

export default function OrganisationInformation() {
  const dispatch = useDispatch<AppDispatch>();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedOrgKey, setSelectedOrgKey] = useState<string | null>(null);


  const openInviteModal = () => {
    setIsInviteModalOpen(true);
  };

  const closeInviteModal = () => {
    setIsInviteModalOpen(false);
  };

  // Get data from the store
  const { organizations, loading, error } = useSelector((state: any) => state.organization);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Fetch organizations when the component mounts
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
    if (!searchTerm) return members;
    return members.filter(
      (member) =>
        member.user__email && member.user__email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  

  const handleDelete = async (orgKey: any, user: any) => {
    try {
      await dispatch(deleteMember({ orgKey, user: user.user__email })).unwrap();
      dispatch(fetchOrganizations());
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

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
            ml={{ base: "55px", md: "0px" }}
            mt={{ base: "0px", md: "20px" }}
            width={{ base: "80%", md: "auto" }}
            overflow={"auto"}
          >
            <Heading size="lg" mb={6} color="black">
              My Organisations
            </Heading>

            {loading && <p>Loading...</p>}
            {/* {error && <p>{error}</p>} */}

            {/* Organisation Tabs */}
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
                          {filteredMembers(organization.members).slice(0, 5).map((member: any, idx: number) => (
                            <Tr key={idx}>
                              <Td color={"black"}>{member.user__email}</Td>
                              <Td color={"black"}>{member.user_role}</Td>
                              <Td textAlign="center" display="flex" justifyContent="center">
                                <IconButton
                                  aria-label="Delete member"
                                  icon={<FaTrash />}
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => handleDelete(organization.org_id, member)}
                                />
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>

                    {organization.members.length > 4 && (
                      <Flex justify="flex-end" mt={2}>
                        <Button variant="link" color="black">
                          View All
                        </Button>
                      </Flex>
                    )}

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
                          {organization.invitations.slice(0, 5).map((invite: any, idx: number) => (
                            <Tr key={idx}>
                              <Td>{invite.email}</Td>
                              <Td>
                                <Badge
                                  backgroundColor={
                                    invite.status === "accepted"
                                      ? "light_green.400"
                                      : invite.status === "Pending"
                                      ? "#3e3e3e"
                                      : "yellow"
                                  }
                                  color="white"
                                  variant="solid"
                                  px={4}
                                  py={2}
                                  borderRadius="full"
                                >
                                  {invite.status}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>

                    {organization.invitations.length > 5 && (
                      <Flex justify="flex-end" mt={2}>
                        <Button variant="link" color="black">
                          View All
                        </Button>
                      </Flex>
                    )}
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          </Box>
        </Flex>
      </Box>
    </>
  );
}
