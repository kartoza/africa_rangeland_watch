import React from "react";
import { Box, Image, Heading, Button, Tabs, TabList, Tab, TabPanels, TabPanel, Table, Thead, Tbody, Tr, Th, Td, Flex, Divider, Text } from "@chakra-ui/react";
import { FaTimes } from "react-icons/fa";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAnalysis: any;
}

const AnalysisSideBar = ({ isOpen, onClose, selectedAnalysis }: SidebarProps) => {
  if (!selectedAnalysis) return null;
  return (
    <Box
      position="fixed"
      top="0"
      right="0"
      width={{ base: "100%", md: "500px" }}
      height="100%"
      bg="white"
      boxShadow="lg"
      display={isOpen ? "block" : "none"}
      zIndex={1000}
      padding={{ base: "15px", md: "20px" }}
      transform={isOpen ? "translateX(0)" : "translateX(100%)"}
      transition="transform 0.3s ease-in-out"
    >
      {/* Close Icon Button */}
      <Button
        position="absolute"
        top="20px"
        right="20px"
        onClick={onClose}
        colorScheme="red"
        borderRadius="50%"
        padding="5px"
        minWidth="auto"
        height="auto"
        width="auto"
        boxShadow="md"
      >
        <FaTimes size={20} color="red" />
      </Button>

      {/* Image */}
      <Image
        src={selectedAnalysis.image}
        alt={selectedAnalysis.heading}
        w={{ base: "100%", md: "100%" }} 
        h={{ base: "200px", md: "50%" }}
        objectFit="cover"
        borderRadius="md"
        mb={4}
      />

      {/* Title and View Analysis Button */}
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align="center"
        mb={4}
      >
        <Heading size="md" color="black" fontWeight="bold" mb={{ base: 2, md: 0 }}>
          {selectedAnalysis.heading}
        </Heading>
        <Button
          colorScheme="green"
          variant="solid"
          backgroundColor="dark_green.800"
          _hover={{ backgroundColor: "light_green.400" }}
          w="auto"
          borderRadius="2px"
          h={8}
        >
          View Analysis
        </Button>
      </Flex>

      <Divider mb={4} borderColor="gray.300" />

      {/* Tabs */}
      <Tabs variant="enclosed" isLazy>
        <TabList>
          <Tab fontWeight="bold" color="black" _selected={{ color: "white", bg: "dark_green.800" }}>
            Info
          </Tab>
          <Tab fontWeight="bold" color="black" _selected={{ color: "white", bg: "dark_green.800" }}>
            Location
          </Tab>
          <Tab fontWeight="bold" color="black" _selected={{ color: "white", bg: "dark_green.800" }}>
            Linked Resources
          </Tab>
        </TabList>

        <TabPanels>
          {/* Info Tab */}
          <TabPanel>
            <Table variant="striped" colorScheme="gray" size="sm">
              <Thead>
                <Tr>
                  <Th color="black" fontWeight="bold">Title</Th>
                  <Th color="black" fontWeight="bold">Value</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td color="black">Owner</Td>
                  <Td color="black">{selectedAnalysis.owner}</Td>
                </Tr>
                <Tr>
                  <Td color="black">Publication</Td>
                  <Td color="black">{selectedAnalysis.publication}</Td>
                </Tr>
                <Tr>
                  <Td color="black">Source</Td>
                  <Td color="black">{selectedAnalysis.source}</Td>
                </Tr>
                <Tr>
                  <Td color="black">Resource Type</Td>
                  <Td color="black">{selectedAnalysis.source}</Td>
                </Tr>
                <Tr>
                  <Td color="black">Added to catalogue</Td>
                  <Td color="black">{selectedAnalysis.source}</Td>
                </Tr>
                <Tr>
                  <Td color="black">Last catalogue modification</Td>
                  <Td color="black">{selectedAnalysis.source}</Td>
                </Tr>
                {/* More rows here */}
              </Tbody>
            </Table>
          </TabPanel>

          {/* Location Tab */}
          <TabPanel>
            <Text color="black">Location details will go here...</Text>
          </TabPanel>

          {/* Linked Resources Tab */}
          <TabPanel>
            <Text color="black">Linked resources will go here...</Text>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default AnalysisSideBar;
