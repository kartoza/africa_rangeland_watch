import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Badge,
  Button,
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
        timestamp: new Date(item.created_at).toLocaleString(),
        is_read: item.is_read,
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

  // Handle notification click to mark as read
  const handleNotificationClick = async (notificationId: number) => {
    try {
      await axios.post(`/api/in-app-notifications-read/${notificationId}/mark_read/`);
      setAllNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  return (
    <><Button
        colorScheme="green"
        size="sm"
        mb={4}
        onClick={async () => {
          await axios.post("/api/in-app-notifications-read/mark_all/");
          setAllNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }}
      >
        Mark all as read
      </Button>
      <Box maxHeight="calc(100vh - 250px)">
        {currentItems.map((notification) => (
          <Box
            key={notification.id}
            onClick={() => handleNotificationClick(notification.id)}
            p={4}
            mb={4}
            bg={notification.is_read ? "gray.100" : "white"} // Highlight unread
            borderRadius="md"
            boxShadow="sm"
            display="flex"
            flexDirection="column"
            position="relative"
            borderLeft="4px solid"
            borderColor={notification.is_read ? "gray.300" : "green.400"} // Unread highlight
            cursor="pointer"
            transition="background 0.2s ease"
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
