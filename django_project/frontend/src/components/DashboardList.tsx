import React from "react";
import {
  Box,
  Grid,
  Flex,
  Text,
  Card,
  CardBody,
  Tag,
  TagLabel,
  Heading,
  Image,
  VStack,
  Button
} from "@chakra-ui/react";
import { format } from 'date-fns';
import Pagination from "../components/Pagination";


interface AllDashboardListProps {
  paginatedData: any[];
  filteredData: any[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  handlePageChange: (page: number) => void;
  handleItemClick: (dashboard: any) => void;
}

const AllDashboardList: React.FC<AllDashboardListProps> = ({
  paginatedData,
  filteredData,
  currentPage,
  totalPages,
  itemsPerPage,
  handlePageChange,
  handleItemClick
}) => {
  
  return (
    <Box 
      maxHeight="calc(100vh - 250px)"
      overflowY="auto"
      mb={6}
      display="flex"
      flexDirection="column"
      gap={4}
    >
      {paginatedData?.length === 0 ? (
        <Flex justify="center" align="center" height="200px">
          <Text fontSize="lg" fontWeight="bold" color="gray.500">
            No data available
          </Text>
        </Flex>
      ) : (
        <VStack>
          <Box>
            <Grid
              templateColumns="repeat(5, 1fr)"
              gap={4}
              width="100%"
              minHeight={"50vh"}
            >
              {paginatedData?.map((dashboard: any, index: number) => {
                return (
                  <Card
                    key={index} 
                    boxShadow="md" 
                    borderRadius="md" 
                    bg="gray.50" 
                    _hover={{ boxShadow: "lg" }} 
                    transition="box-shadow 0.2s ease" 
                    cursor="pointer"
                    display="flex"
                    flexDirection="column"
                    onClick={() => handleItemClick(dashboard)}
                    minWidth={"18vw"}
                  >
                    <CardBody
                      p={4} 
                      display="flex" 
                      flexDirection="column" 
                      height="300px"
                      className="card-body"
                    >
                      <VStack spacing={3} height="100%" justify="space-between">
                        <VStack spacing={3} width="100%">
                          <Image
                            src={dashboard.thumbnail} 
                            height="200px" 
                            width="100%" 
                            objectFit="cover"
                            borderRadius="md"
                            fallbackSrc="https://via.placeholder.com/300x120?text=No+Image"
                          />
                          <Heading
                            size="md" 
                            fontWeight="bold" 
                            color="black" 
                            mb={2}
                            noOfLines={2}
                            onClick={() => handleItemClick(dashboard)}
                            cursor="pointer"
                            width={"100%"}
                          >
                            {dashboard.title}
                          </Heading>

                          <Text
                            color="gray.600" 
                            fontSize="sm" 
                            mb={3}
                            noOfLines={3}
                            flex="1"
                            cursor="pointer"
                            width={"100%"}
                          >
                            {dashboard.config.dashboardDescription}
                          </Text>
                        </VStack>

                        {/* Tags - This will be pushed to the bottom */}
                        <Box display="flex" flexDirection="column" gap={2} width={"100%"}>
                          <Tag colorScheme="green" size="sm">
                            <TagLabel fontSize="xs">
                              {format(new Date(dashboard?.updated_at), "MMM dd, yyyy")}
                            </TagLabel>
                          </Tag>
                          <Tag colorScheme="teal" size="sm">
                            <TagLabel fontSize="xs">
                              {dashboard.owner_name ? dashboard.owner_name : "N/A"}
                            </TagLabel>
                          </Tag>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                );
              })}
            </Grid>
          </Box>
          <Box>
            {filteredData?.length > itemsPerPage && (
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                handlePageChange={handlePageChange} 
              />
            )}
          </Box>
        </VStack>
      )}
    </Box>
  );
};

export default AllDashboardList;
