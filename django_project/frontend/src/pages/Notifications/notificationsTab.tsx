import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Badge,
  Button,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
} from "@chakra-ui/react";
import "../../styles/index.css";
import Pagination from "../../components/Pagination";
import axios from "axios";
import { useNotifications } from "../../components/NotificationContext";

export default function NotificationsTab({ category }: { category: string }) {
  const [allNotifications, setAllNotifications] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { fetchNotifications } = useNotifications();
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchNotificationsData = async () => {
      try {
        let response;
        if (category === "all") {
          response = await axios.get("/api/in-app-notifications/");
          const formatted = response.data.results.map((item: any) => ({
            id: item.id,
            title: item.alert_setting?.name || "Unnamed Alert",
            description: item.text || "No description provided.",
            badge: item.alert_setting?.indicator || "General",
            timestamp: new Date(item.created_at).toLocaleString(),
            is_read: item.is_read,
          }));
          setAllNotifications(formatted);
        } else {
          response = await axios.get(`/api/categorized-alerts/categorized/?category=${category}`);
          const formatted = response.data.map((item: any) => ({
            id: item.id,
            title: item.alert_setting?.name || "Unnamed Alert",
            description: item.text || "No description provided.",
            badge: category.charAt(0).toUpperCase() + category.slice(1),
            timestamp: new Date(item.created_at).toLocaleString(),
            is_read: item.is_read ?? false, // fallback
          }));
          setAllNotifications(formatted);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
  
    fetchNotificationsData();
  }, [category]);

  const totalPages = Math.ceil(allNotifications.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = allNotifications.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <Flex alignItems="center" mt={4} mb={4} px={2}>
        <Button
          colorScheme="green"
          size="sm"
          onClick={async () => {
            await axios.post("/api/in-app-notifications-read/mark_all/");
            setAllNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            fetchNotifications(); // Refresh notification count
          }}
        >
          Mark all as read
        </Button>
        <Button
          colorScheme="gray"
          size="sm"
          onClick={async () => {
            try {
              await axios.post(`/api/in-app-notifications-read/${selectedNotification.id}/mark_unread/`);
              setAllNotifications(prev =>
                prev.map(n =>
                  n.id === selectedNotification.id ? { ...n, is_read: false } : n
                )
              );
              onClose();
              fetchNotifications(); // Refresh notification count
            } catch (err) {
              console.error("Failed to mark as unread", err);
            }
          }}
        >
          Mark as Unread
        </Button>
      </Flex>
      <Box maxHeight="calc(100vh - 250px)">
        {currentItems.map((notification) => (
          <Box
            key={notification.id}
            onClick={async () => {
              if (!notification.is_read) {
                try {
                  await axios.post(`/api/in-app-notifications-read/${notification.id}/mark_read/`);
                  
                  const updated = {
                    ...notification,
                    is_read: true
                  };
              
                  // Update the full list
                  setAllNotifications(prev =>
                    prev.map(n => n.id === notification.id ? updated : n)
                  );
              
                  setSelectedNotification(updated);
                  fetchNotifications();
                } catch (err) {
                  console.error("Failed to mark notification as read", err);
                  setSelectedNotification(notification); // fallback to original
                }
              } else {
                setSelectedNotification(notification);
              }
              
              onOpen();
            }}
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
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay zIndex={1400}/>
          <ModalContent
            zIndex={1500}
            bg="white"
            maxW="2xl"
            mx="auto"
            my="auto"
            borderRadius="md"
            boxShadow="xl"
            >
            <ModalHeader fontSize="lg" fontWeight="bold" color="dark_green">
              {selectedNotification?.title}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6} px={4}>
              <Text fontSize="sm" color="gray.600" mb={2}>
                {selectedNotification?.timestamp}
              </Text>
              <Text fontSize="md" color="gray.800" whiteSpace="pre-line">
                {selectedNotification?.description}
              </Text>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    </>
  );
}
