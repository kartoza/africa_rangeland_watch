import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Badge,
} from "@chakra-ui/react";
import "../../styles/index.css";

export default function NotificationsTab() {
  const [allNotifications, setAllNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Simulate fetching data for "All" notifications
    const fetchNotificationsData = () => {

      setAllNotifications([]);
    };

    fetchNotificationsData();
  }, []);

  return (
    <>
      <Box>
        {allNotifications.map((notification) => (
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
            minHeight="150px"
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
            <Heading size="sm" mb={2} color="black">
              {notification.title}
            </Heading>

            {/* Description */}
            <Text color="black" mb={4}>
              {notification.description}
            </Text>

            {/* Timestamp */}
            <Text
              color="black"
              position="absolute"
              bottom={4}
              left={4} 
              fontSize="sm"
            >
              {notification.timestamp}
            </Text>
          </Box>
        ))}
      </Box>
    </>
  );
}
