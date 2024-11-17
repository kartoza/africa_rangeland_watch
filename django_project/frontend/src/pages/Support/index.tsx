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
  Stack,
  Tag,
  TagLabel,
  Select,
  Textarea,
  useToast,
  Icon,
} from "@chakra-ui/react";
import { FaFilter, FaPlus, FaCloudUploadAlt, FaTrash } from "react-icons/fa";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import "../../styles/index.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchTickets, createTicket, fetchIssueTypes } from "../../store/ticketSlice";
import { AppDispatch, RootState } from "../../store";
import { selectUserEmail } from "../../store/authSlice";


export default function SupportPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [issueType, setIssueType] = useState<number | string>('');
  const [issueTitle, setIssueTitle] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();

 
  const { tickets, loading, error } = useSelector((state: RootState) => state.ticket);
  const issueTypes = useSelector((state: RootState) => state.ticket.issueTypes);
  const userEmail = useSelector(selectUserEmail); 


  useEffect(() => {
    dispatch(fetchTickets());
    dispatch(fetchIssueTypes());
  }, [dispatch]);

  // Handle ticket creation
  const handleCreateTicket = async () => {
    try {
      const ticketData = { 
        title: issueTitle,
        issue_type: typeof issueType === 'string' ? parseInt(issueType, 10) : issueType,
        description: additionalDetails,
        email: userEmail,
        file_attachment: screenshot
      };
  
      await dispatch(createTicket(ticketData));

      dispatch(fetchTickets());
  
      if (!error) {
        toast({
          title: "Ticket Created",
          description: "Your support ticket has been submitted.",
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top-right",
          containerStyle: {
            backgroundColor: "#00634b",
            color: "white",
          },
        });
  
        setCreatingTicket(false);
        setIssueType("");
        setIssueTitle("");
        setAdditionalDetails("");
        setScreenshot(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong while creating your ticket.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    }
  };
  

  const handleCancel = () => {
    setCreatingTicket(false);
    // Reset form data
    setIssueType("");
    setIssueTitle("");
    setAdditionalDetails("");
    setScreenshot(null);
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
  };

  return (
    <>
      <Helmet>
        <title>Support</title>
        <meta name="description" content="Contact support and view tickets." />
      </Helmet>
      <Header />

      <Box bg="white" w="100%" overflow={"hidden"}>
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
              Support
            </Heading>

            {/* Search & Action Row */}
            {!creatingTicket && (
              <Flex justify="space-between" align="center" mb={6} direction={{ base: "column", md: "row" }}>
                {/* Search Field */}
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
                      isDisabled={creatingTicket}
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
                      isDisabled={creatingTicket}
                    />
                  </Flex>
                </Box>

                {/* Create Ticket Button */}
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
                    isDisabled={creatingTicket}
                    onClick={() => setCreatingTicket(true)}
                  >
                    Create Ticket
                  </Button>
                </Box>
              </Flex>
            )}

            {/* Content Section */}
            <Divider mb={6} borderColor="black" borderWidth="1px" />

            {loading && <Text>Loading...</Text>}
            {error && <Text>{error}</Text>}

            {/* Ticket List */}
            {!creatingTicket && (
              <Box
                maxHeight="calc(100vh - 250px)"
                overflowY="hidden"
                mb={6}
                display="flex"
                flexDirection="column"
                gap={4}
              >
                {(showAll ? tickets : tickets.slice(0, 7)).map((ticket, index) => (
                <Box key={index} boxShadow="md" borderRadius="md" p={4} border="1px" borderColor="gray.300">
                    <Flex direction="column" gap={2} position="relative">
                    {/* Badge (Status) */}
                    <Tag
                        style={{
                        backgroundColor:
                            ticket.status === "open"
                            ? "#91e05e"
                            : ticket.status === "in_progress"
                            ? "yellow" 
                            : ticket.status === "resolved"
                            ? "#c4c4c4" 
                            : "#c4c4c4",
                        }}
                        position="absolute"
                        top="0"
                        right="0"
                        borderRadius="full"
                    >
                        <TagLabel>{ticket.status}</TagLabel> 
                    </Tag>

                    {/* Title */}
                    <Heading size="md" fontWeight="bold" color="black">
                        {ticket.title}
                    </Heading>

                    {/* Description */}
                    <Text mt={2} color="black">
                        {ticket.description}
                    </Text>

                    {/* Created Timestamp */}
                    <Text mt={2} color="gray.500" fontSize="sm">
                        {new Date(ticket.created_at).toLocaleString()}
                    </Text>

                    </Flex>
                </Box>
                ))}

                {/* View All Button */}
                {!showAll && tickets.length > 7 && (
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
            )}

            {/* Ticket Creation Form */}
            {creatingTicket && (
              <Box bg="gray.50" p={6} borderRadius="md" boxShadow="md">
                <Heading size="md" color="black" mb={4}>Create New Ticket</Heading>

                <Stack spacing={4}>
                  {/* Issue Type */}
                  <Box>
                    <Text color="black" fontWeight="bold" mb={2}>
                        What issues are you experiencing?
                    </Text>
                    <Select
                        value={issueType}
                        onChange={(e) => setIssueType(e.target.value)}
                        placeholder="Select issue type"
                        isRequired
                        width="45%"
                    >
                        {issueTypes.map((issue) => (
                        <option key={issue.id} value={issue.id}>
                            {issue.name}
                        </option>
                        ))}
                    </Select>
                </Box>

                  {/* Issue Title */}
                  <Box>
                    <Text color="black" fontWeight="bold" mb={2}>Issue Title</Text>
                    <Input
                      value={issueTitle}
                      onChange={(e) => setIssueTitle(e.target.value)}
                      placeholder="Describe your issue"
                      isRequired
                      width="45%" 
                    />
                  </Box>

                  {/* Screenshot Upload Area */}
                  <Box>
                    <Text color="black" fontWeight="bold" mb={2}>Upload Attachments (Optional)</Text>
                    <Box
                      border="2px solid #e2e8f0" 
                      borderRadius="md"
                      p={6}
                      textAlign="center"
                      cursor="pointer"
                      _hover={{ backgroundColor: "white" }}
                      width="100%"
                      onClick={() => document.getElementById('file-upload').click()}
                    >
                      <Icon as={FaCloudUploadAlt} w={16} h={16} color="gray.600" mb={2} /> 
                      <Text color="gray.600">Drag and drop files here</Text>
                      <Input
                        type="file"
                        id="file-upload"
                        onChange={(e) => setScreenshot(e.target.files[0])}
                        accept="image/*"
                        display="none"
                      />
                    </Box>
                    {screenshot && (
                      <Flex mt={4} align="center">
                        <Text color="black">{screenshot.name}</Text> {/* Make text black */}
                        <Button
                          ml={4}
                          onClick={handleRemoveScreenshot}
                          colorScheme="red"
                          variant="ghost"
                          leftIcon={<FaTrash />}
                        >
                          Remove
                        </Button>
                      </Flex>
                    )}
                  </Box>

                  {/* Additional Details */}
                  <Box>
                    <Text color="black" fontWeight="bold" mb={2}>Additional Details</Text>
                    <Textarea
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      placeholder="Provide more details"
                      isRequired
                      height="150px"
                    />
                  </Box>

                  {/* Cancel and Submit Buttons */}
                  <Flex justify="flex-end" gap={4}>
                    <Button 
                      onClick={handleCancel} 
                      backgroundColor="darkorange"
                      _hover={{ backgroundColor: "dark_orange.800" }}
                      color="white"
                      w="auto"
                      borderRadius="5px"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateTicket}
                      backgroundColor="dark_green.800"
                      _hover={{ backgroundColor: "light_green.400" }}
                      color="white"
                      w={{base:"auto", md:"25%"}}
                      borderRadius="5px"
                    >
                      Submit
                    </Button>
                  </Flex>
                </Stack>
              </Box>
            )}
          </Box>
        </Flex>
      </Box>
    </>
  );
}
