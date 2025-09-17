import React, { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import {
  Box,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Text,
  Spinner,
  Center,
} from "@chakra-ui/react";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import Pagination from "../../components/Pagination";

interface EarthRangerEvent {
  id: string;
  event_type: string;
  time: string;
  reported_by: string;
  location: {
    latitude: number;
    longitude: number;
  };
  priority_label: string;
  event_details: {
    Comment: string;
    Auc_vill_name: string;
  };
}

interface EarthRangerResponse {
  count: number;
  next: string | null;
  previous: string | null;
  page: number;
  total_page: number;
  page_size: number;
  results: EarthRangerEvent[];
}

export default function EarthRangerEventsPage() {
  const { settingsId } = useParams();
  const [eventsData, setEventsData] = useState<EarthRangerResponse | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const fetchEvents = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/earthranger/settings/${settingsId}/events/?page=${page}&page_size=${pageSize}&simple=true`);
      const data: EarthRangerResponse = await response.json();
      setEventsData(data);
      setCurrentPage(data.page);
    } catch (error) {
      console.error("Error fetching EarthRanger events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(1);
  }, []);

  function toggleDetails(eventId: string) {
    if (selectedEventId === eventId) {
      setSelectedEventId(null);
    } else {
      setSelectedEventId(eventId);
    }
  }

  function handlePageChange(page: number) {
    fetchEvents(page);
  }

  const events = eventsData?.results || [];
  const totalPages = eventsData?.total_page || 0;

  return (
    <>
      <Header />

      <Box bg="white" w="100%">
        <Flex direction={{ base: "column", md: "row" }} gap="30px" alignItems="start">
          <Sidebar display={{ base: "none", md: "flex" }} />

          <Box
            flex="1"
            ml={{ base: "35px", md: "0px" }}
            mt={{ base: "15px", md: "20px" }}
            width={{ base: "80%", md: "auto" }}
            overflow="auto"
          >
            <Text fontSize="2xl" fontWeight="bold" mb={6} color="black">
              EarthRanger Events
            </Text>

            {eventsData && (
              <Text fontSize="sm" color="gray.600" mb={4}>
                Showing {events.length} of {eventsData.count} events (Page {currentPage} of {totalPages})
              </Text>
            )}

            {loading ? (
              <Center h="70vh">
                <Spinner size="xl" />
              </Center>
            ) : events.length === 0 ? (
              <Text>No EarthRanger events found.</Text>
            ) : (
              <>
                <Table variant="simple">
                  <Thead bg="gray.100">
                    <Tr>
                      <Th>Event Type</Th>
                      <Th>Date/Time</Th>
                      <Th>Reporter</Th>
                      <Th>Location</Th>
                      <Th>Priority</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {events.map((event) => (
                      <React.Fragment key={event.id}>
                        <Tr _hover={{ bg: "gray.50" }}>
                          <Td>{event.event_type || "Unknown"}</Td>
                          <Td>{event.time || "Unknown"}</Td>
                          <Td>{event.reported_by || "Unknown"}</Td>
                          <Td>
                            {event.location
                              ? `${event.location.latitude}, ${event.location.longitude}`
                              : "Unknown"}
                          </Td>
                          <Td>
                            <Box
                              w="10px"
                              h="10px"
                              borderRadius="50%"
                              backgroundColor={
                                event.priority_label === "Red"
                                  ? "red.500"
                                  : event.priority_label === "Green"
                                    ? "green.500"
                                    : event.priority_label === "Yellow"
                                      ? "yellow.400"
                                      : "gray.400"
                              }
                              mx="auto"
                            />
                          </Td>
                          <Td>
                            <Button
                              size="sm"
                              backgroundColor="dark_green.800"
                              _hover={{ backgroundColor: "light_green.400" }}
                              color="white"
                              fontWeight="bold"
                              borderRadius="5px"
                              onClick={() => toggleDetails(event.id)}
                            >
                              {selectedEventId === event.id ? "Hide Details" : "View Details"}
                            </Button>
                          </Td>
                        </Tr>

                        {selectedEventId === event.id && (
                          <Tr bg="gray.50">
                            <Td colSpan={6}>
                              <Box p={4} color="black">
                                <Text mb={2} color="gray.800">
                                  <strong>Comment:</strong> {event.event_details?.Comment || "No Comment"}
                                </Text>
                                <Text mb={2} color="gray.800">
                                  <strong>Village:</strong> {event.event_details?.Auc_vill_name || "Unknown"}
                                </Text>
                              </Box>
                            </Td>
                          </Tr>
                        )}
                      </React.Fragment>
                    ))}
                  </Tbody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    handlePageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </Box>
        </Flex>
      </Box>
    </>
  );
}