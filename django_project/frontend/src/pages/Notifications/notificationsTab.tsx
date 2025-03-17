import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Badge,
} from "@chakra-ui/react";
import "../../styles/index.css";
import Pagination from "../../components/Pagination";

export default function NotificationsTab() {
  const [allNotifications, setAllNotifications] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // useEffect(() => {
  //   const fetchNotificationsData = () => {

  //     setAllNotifications([]);
  //   };

  //   fetchNotificationsData();
  // }, []);

  useEffect(() => {
    // Simulate fetching data for "All" notifications
    const fetchNotificationsData = () => {
      const dummyData = [
        {
          id: 1,
          title: "System Update",
          description: "A new system update is available. Please update to the latest version.",
          badge: "New",
          timestamp: "2025-03-04 10:00 AM",
        },
        {
          id: 2,
          title: "Payment Reminder",
          description: "Your subscription payment is due in 3 days. Please make the payment to avoid interruption.",
          badge: "Reminder",
          timestamp: "2025-03-03 08:30 AM",
        },
        {
          id: 3,
          title: "Security Alert",
          description: "Unusual login detected from a new device. If this wasn't you, please secure your account.",
          badge: "Alert",
          timestamp: "2025-03-02 05:45 PM",
        },
        {
          id: 4,
          title: "Security Alert",
          description: "Unusual login detected from a new device. If this wasn't you, please secure your account.",
          badge: "Alert",
          timestamp: "2025-03-02 05:45 PM",
        },
        {
          id: 5,
          title: "Security Alert",
          description: "Unusual login detected from a new device. If this wasn't you, please secure your account.",
          badge: "Alert",
          timestamp: "2025-03-02 05:45 PM",
        },
        {
          id: 6,
          title: "Security Alert",
          description: "Unusual login detected from a new device. If this wasn't you, please secure your account.",
          badge: "Alert",
          timestamp: "2025-03-02 05:45 PM",
        },
        {
          id: 7,
          title: "Security Alert",
          description: "Unusual login detected from a new device. If this wasn't you, please secure your account.",
          badge: "Alert",
          timestamp: "2025-03-02 05:45 PM",
        },
      ];

      setAllNotifications(dummyData);
    };

    fetchNotificationsData();
  }, []);

  const totalPages = Math.ceil(allNotifications.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = allNotifications.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <Box maxHeight="calc(100vh - 250px)">
        {currentItems.map((notification) => (
          <Box
            key={notification.id}
            p={4}
            mb={4}
            bg="gray.50"
            borderRadius="md"
            boxShadow="sm"
            display="flex"
            flexDirection="column"
            position="relative"
          >
            {/* Badge - Custom styled */}
            <Badge
              colorScheme="green"
              position="absolute"
              top={2}
              right={2}
              fontSize="sm"
              fontWeight="normal"
              px={2}
              py={1} 
            >
              {notification.badge}
            </Badge>

            {/* Title */}
            <Heading size="sm" mb={4} color="black">
              {notification.title}
            </Heading>

            {/* Description */}
            <Text color="black" mb={6} fontSize="sm">
              {notification.description}
            </Text>

            {/* Timestamp */}
            <Text
              color="gray.500"
              position="absolute"
              bottom={2}
              left={4}
              fontSize="sm"
            >
              {notification.timestamp}
            </Text>
          </Box>
        ))}

        <Pagination currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
      </Box>
    </>
  );
}
