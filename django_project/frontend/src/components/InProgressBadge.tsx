import React from "react";
import { Box, Badge, Text } from "@chakra-ui/react";


export const InProgressBadge = () => {
    return (
      <Box mb={4} p={3} bg="yellow.200" borderRadius="md" textAlign="center">
        <Badge colorScheme="yellow">In Progress</Badge>
        <Text fontSize="sm" color="black">This feature is currently in development.</Text>
      </Box>
    )
}
