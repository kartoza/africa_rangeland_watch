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
import Sidebar1 from "../../components/SideBar";
import '../../styles/index.css';

// Define types for the data
interface Member {
  user: string;
  role: string;
}

interface Invitation {
  user: string;
  role: string;
  status: string;
}

interface Organization {
  members: Member[];
  invitations: Invitation[];
}

// Dummy data for demonstration
const organizations: { [key: string]: Organization } = {
  default: {
    members: [],
    invitations: [],
  },
  org2: {
    members: [],
    invitations: [],
  },
};

export default function OrganisationInformation() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <>
      <Helmet>
        <title>Organisation Information - Manage Organisation Details</title>
        <meta name="description" content="Manage your organisation's information, members, and invitations." />
      </Helmet>
      <Header />

      <Box bg="white" w="100%">
        <Flex direction={{ base: "column", md: "row" }} gap="30px" alignItems="start">
          {/* Sidebar */}
          <Sidebar1 display={{ base: "none", md: "flex" }} />

          {/* Main Content */}
          <Box flex="1" ml={{ base: "55px", md: "0px" }} mt={{ base: "0px", md: "20px" }} width={{base: "80%", md: "auto"}} overflow={'auto'}>
            <Heading size="lg" mb={6} color="black">
              My Organisations
            </Heading>

            {/* Organisation Tabs */}
            <Tabs variant="unstyled">
              <Box width="fit-content" border="1px solid" borderColor="gray.300" borderBottom="none" borderRadius="5px" overflow="hidden">
                <TabList>
                  {Object.keys(organizations).map((orgKey, idx) => (
                    <Tab
                      key={idx}
                      _selected={{ color: "white", bg: "dark_green.800" }}
                      _hover={{ bg: "light_green.400" }}
                      px={6}
                      py={2}
                    >
                      {orgKey}
                    </Tab>
                  ))}
                </TabList>
              </Box>

              <Divider mb={6} borderColor="black" borderWidth="1px" width={{base:"auto", md:"99%"}}/>

              <TabPanels>
                {Object.values(organizations).map((organization, index) => (
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
                      >
                        Add People
                      </Button>
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
                          {organization.members.slice(0, 5).map((member, idx) => (
                            <Tr key={idx}>
                              <Td>{member.user}</Td>
                              <Td>{member.role}</Td>
                              <Td textAlign="center" display="flex" justifyContent="center">
                                <IconButton
                                  aria-label="Delete member"
                                  icon={<FaTrash />}
                                  colorScheme="red"
                                  variant="ghost"
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
                            <Td fontWeight="bold">User</Td>
                            <Td fontWeight="bold">Role</Td>
                            <Td fontWeight="bold">Status</Td>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {organization.invitations.slice(0, 5).map((invite, idx) => (
                            <Tr key={idx}>
                              <Td>{invite.user}</Td>
                              <Td>{invite.role}</Td>
                              <Td>
                                <Badge
                                  backgroundColor={invite.status === "Joined" ? "light_green.400" : invite.status === "Pending" ? "#3e3e3e" : "yellow"}
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