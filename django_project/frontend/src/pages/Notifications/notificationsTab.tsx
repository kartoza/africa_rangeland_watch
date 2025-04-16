import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Badge,
} from "@chakra-ui/react";
import "../../styles/index.css";
import Pagination from "../../components/Pagination";
import axios from "axios";

export default function NotificationsTab() {
  const [allNotifications, setAllNotifications] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchNotificationsData = async () => {
      const response = await axios.get("/api/in-app-notifications/");
      setAllNotifications(response.data.map((item: any) => ({
        id: item.id,
        title: item.alert_setting.name,
        badge: item.alert_setting.indicator,  // can map to name if needed
        description: item.text,
        timestamp: new Date(item.created_at).toLocaleString()
      })));
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
