import React, { useEffect, useState } from "react";
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

export default function EarthRangerEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetch("/earthranger/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching EarthRanger events:", error);
        setLoading(false);
      });
  }, []);

  const totalPages = Math.ceil(events.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = events.slice(indexOfFirstItem, indexOfLastItem);

  function toggleDetails(eventId: string) {
    if (selectedEventId === eventId) {
      setSelectedEventId(null); // collapse if clicking the same event
    } else {
      setSelectedEventId(eventId); // open
    }
  }

  function handlePageChange(page: number) {
    setCurrentPage(page);
  }

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

            {loading ? (
              <Center h="70vh">
                <Spinner size="xl" />
              </Center>
            ) : currentItems.length === 0 ? (
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
                    {currentItems.map((event) => (
                      <React.Fragment key={event.id}>
                        <Tr _hover={{ bg: "gray.50" }}>
                          <Td>{event.event_type || "Unknown"}</Td>
                          <Td>{event.time || "Unknown"}</Td>
                          <Td>{event.reported_by?.name || "Unknown"}</Td>
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
																	: "gray.400" // fallback for "Unknown"
															}
															mx="auto" // center the circle inside the cell
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
