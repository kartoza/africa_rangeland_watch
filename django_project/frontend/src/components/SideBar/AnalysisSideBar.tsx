import React, {useState} from "react";
import { Box, Button, Tabs, TabList, Tab, TabPanels, TabPanel, Table, Thead, Tbody, Tr, Th, Td, Flex, Divider, Text, Heading, Link, Spinner } from "@chakra-ui/react";
import { FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import { InProgressBadge } from "../InProgressBadge";
import { RenderResult } from "../DashboardCharts/CombinedCharts";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAnalysis: any;
}

const MotionBox = motion(Box);
const MotionOverlay = motion(Box);

const AnalysisSideBar = ({ isOpen, onClose, selectedAnalysis }: SidebarProps) => {
  const [isDownloading, setIsDownloading] = useState(null);

  if (!selectedAnalysis) return null;

  const handleDownload = async (id: string, event: any) => {
    try {
      event.preventDefault();
      setIsDownloading(id);
      let url = `user_analysis_results/download_raster_output/${id}`;
      const response = await fetch(url);
      if (!response.ok) {
        setIsDownloading(null);
        if (response.status === 404) {
          alert("File not found (404). Please check the ID and try again.");
        } else {
          alert(`Download failed with status: ${response.status}`);
        }
        return;
      }

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${id}.tif`; // Default filename

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed", error);
      alert("An error occurred while downloading the file. Please try again.");
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <>
      {/* Overlay (Blur + Fade Effect) */}
      {isOpen && (
        <MotionOverlay
          position="fixed"
          top="0"
          left="0"
          width="100vw"
          height="100vh"
          bg="rgba(0, 0, 0, 0.4)"
          backdropFilter="blur(5px)"
          zIndex={999} 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <MotionBox
        position="fixed"
        top="20%"
        right="0"
        transform="translateY(-20%)"
        width={{ base: "100%", md: "500px" }}
        maxHeight="90vh"
        bg="white"
        boxShadow="lg"
        zIndex={1000}
        padding={{ base: "15px", md: "20px" }}
        borderRadius="12px 0 0 12px"
        initial={{ x: "100%" }}
        animate={{ x: isOpen ? "0%" : "100%" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        overflowY="auto"
      >

        {/* Close Button */}
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
          <FaTimes size={20} color="green" />
        </Button>

        {/* Image */}
        <Box
          w={{ base: "100%", md: "100%" }}
          h={{ base: "auto", md: "auto" }}
          objectFit="cover"
          borderRadius="md"
          mt={8}
          mb={4}
          overflow={"auto"}
        >
          <RenderResult analysisResults={[selectedAnalysis?.analysis_results]} />
        </Box>

        {/* Title and View Analysis Button */}
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md" color="black" fontWeight="bold">
            {selectedAnalysis?.heading}
          </Heading>
          <Button colorScheme="green" variant="solid" backgroundColor="dark_green.800" _hover={{ backgroundColor: "light_green.400" }} borderRadius="2px" h={8} disabled>
            View Analysis
          </Button>
        </Flex>

        <Divider mb={4} borderColor="gray.300" />

        {/* Tabs */}
        <Tabs variant="enclosed">
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
            { selectedAnalysis?.analysis_results?.data?.analysisType === 'Temporal' &&
              <Tab fontWeight="bold" color="black" _selected={{ color: "white", bg: "dark_green.800" }}>
                Raster Output
              </Tab>
            }
            
          </TabList>

          <TabPanels>
            {/* Info Tab */}
            <TabPanel>
              <Table variant="striped" colorScheme="gray" size="sm">
                <Thead>
                  <Tr>
                    <Th color="black">Title</Th>
                    <Th color="black">Value</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td color="black">Owner</Td>
                    <Td color="black">{selectedAnalysis?.created_by?.name}</Td>
                  </Tr>
                  <Tr>
                    <Td color="black">Publication</Td>
                    <Td color="black">{selectedAnalysis?.dashboards && selectedAnalysis.dashboards.length > 0 && ('Dashboard')}</Td>
                  </Tr>
                  <Tr>
                    <Td color="black">Source</Td>
                    <Td color="black">{selectedAnalysis?.source}</Td>
                  </Tr>
                  <Tr>
                    <Td color="black">Resource Type</Td>
                    <Td color="black">{selectedAnalysis?.analysis_results?.data?.analysisType}</Td>
                  </Tr>
                </Tbody>
              </Table>
            </TabPanel>

            {/* Location Tab */}
            <TabPanel>
              <Table variant="striped" colorScheme="gray" size="sm">
                <Thead>
                  <Tr>
                    <Th color="black">Title</Th>
                    <Th color="black">Value</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td color="black">Community Name</Td>
                    <Td color="black">{selectedAnalysis?.analysis_results?.data?.communityName || "N/A"}</Td>
                  </Tr>
                  <Tr>
                    <Td color="black">Landscape</Td>
                    <Td color="black">{selectedAnalysis?.analysis_results?.data?.landscape || "N/A"}</Td>
                  </Tr>
                  <Tr>
                    <Td color="black">Latitude</Td>
                    <Td color="black">{selectedAnalysis?.analysis_results?.data?.latitude?.toFixed(6) || "N/A"}</Td>
                  </Tr>
                  <Tr>
                    <Td color="black">Longitude</Td>
                    <Td color="black">{selectedAnalysis?.analysis_results?.data?.longitude?.toFixed(6) || "N/A"}</Td>
                  </Tr>
                </Tbody>
              </Table>
            </TabPanel>

            {/* Linked Resources Tab */}
            <TabPanel>
              {selectedAnalysis?.dashboards && selectedAnalysis.dashboards.length > 0 ? (
                <Table variant="striped" colorScheme="gray" size="sm">
                  <Thead>
                    <Tr>
                      <Th color="black">Dashboards</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {selectedAnalysis.dashboards.map((dashboard: { id: string; title: string }) => (
                      <Tr key={dashboard.id}>
                        <Td color="black">{dashboard.title}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text color="black">No linked resources found.</Text>
              )}
            </TabPanel>
            
            {/* Raster Output Tab */}
            { selectedAnalysis?.analysis_results?.data?.analysisType === 'Temporal' &&
              <TabPanel>
                <Box maxW="100%" overflowX="auto">
                <Table variant="striped" colorScheme="gray" size="sm">
                <Thead>
                  <Tr>
                    <Th color="black">Name</Th>
                    <Th color="black">Download</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {selectedAnalysis?.raster_output_list.map((raster_output: any) => {
                    return (
                      <Tr>
                        <Td>
                          <Text color="black" isTruncated>
                            {raster_output.name}
                          </Text>
                        </Td>
                        <Td color="black">
                          {raster_output.status === 'COMPLETED' && isDownloading !== raster_output.id  && (
                            <Link href="#" color="blue.500" onClick={(event) => handleDownload(raster_output.id, event)}>
                              Download
                            </Link>
                          )}
                          {raster_output.status === 'COMPLETED' && isDownloading === raster_output.id && (
                            <Flex>
                              <Spinner size="sm" />
                              <Text ml={2} color="blue.500">Downloading...</Text>
                            </Flex>
                          )}
                          {raster_output.status === 'PENDING' && 'Pending'}
                          {raster_output.status === 'RUNNING' && 'Generating Raster File'}
                          {raster_output.status === 'FAILED' && 'Failed to generate Raster File!'}
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
              </Box>
              </TabPanel>
            }

          </TabPanels>
        </Tabs>
      </MotionBox>
    </>
  );
};

export default AnalysisSideBar;
