import { ChakraProps, Text, Link, UnorderedList, ListItem, Image, Flex, Heading, Box } from "@chakra-ui/react";
import React from "react";

interface Props extends ChakraProps {
  className?: string;
}

export default function Footer(props: Props) {
  return (
    <Box bg="dark_green.800" padding="20px" color="white">
      <Flex
        flexDirection={{ base: "column", md: "row" }}
        alignItems="center"
        mb="20px"
        justifyContent="center"
      >
        {/* First Row */}
        <Flex
          flex="1"
          justifyContent="center"
          gap={{ base: "5px", md: "8px" }} // Reduced gap between columns
          flexDirection={{ base: "column", md: "row" }}
        >
          {/* Column 1: Help */}
          <Box flex="1" textAlign={{ base: "center", md: "right" }}>
            <Heading size="lg" mb="2" fontWeight="bold" color="white">Help</Heading>
            <UnorderedList styleType="none" spacing={1}>
              <ListItem>
                <Link href="#" fontSize="13px" fontWeight="bold" color="white">Dummy Link 1</Link>
              </ListItem>
              <ListItem>
                <Link href="#" fontSize="13px" fontWeight="bold" color="white">Dummy Link 2</Link>
              </ListItem>
            </UnorderedList>
          </Box>

          {/* Column 2: About Us */}
          <Box flex="1" textAlign="center">
            <Heading size="lg" mb="2" fontWeight="bold" color="white">About Us</Heading>
            <UnorderedList styleType="none" spacing={1}>
              <ListItem>
                <Link href="#/about" fontSize="13px" fontWeight="bold" color="white">Africa Rangeland Watch</Link>
              </ListItem>
              <ListItem>
                <Link href="#" fontSize="13px" fontWeight="bold" color="white">Conservation South Africa</Link>
              </ListItem>
            </UnorderedList>
          </Box>

          {/* Column 3: Resources */}
          <Box flex="1" textAlign={{ base: "center", md: "left" }}>
            <Heading size="lg" mb="2" fontWeight="bold" color="white">Resources</Heading>
            <UnorderedList styleType="none" spacing={1}>
            <ListItem>
                <Link href="#" fontSize="13px" fontWeight="bold">ARW Documentation</Link>
              </ListItem>
              <ListItem>
                <Link href="#" fontSize="13px" fontWeight="bold">Policy Briefs</Link>
              </ListItem>
              <ListItem>
                <Link href="#" fontSize="13px" fontWeight="bold">Case Studies</Link>
              </ListItem>
              <ListItem>
                <Link href="#" fontSize="13px" fontWeight="bold">Conservation News</Link>
              </ListItem>
            </UnorderedList>
          </Box>
        </Flex>
      </Flex>

      {/* Second Row */}
      <Flex
        justifyContent="space-between"
        alignItems="center"
        flexDirection={{ base: "column", md: "row" }}
        mt="20px"
      >
        <Image src="/static/images/main_logo.svg" alt="Footer Logo" h="58px" />

        <UnorderedList styleType="none" display="flex" justifyContent="center" flexWrap="wrap" gap="20px">
          <ListItem>
            <Link href="#" fontSize="13px">Contact Us</Link>
          </ListItem>
          <ListItem>
            <Link href="#" fontSize="13px">Terms of Use</Link>
          </ListItem>
          <ListItem>
            <Link href="#" fontSize="13px">Privacy Policy</Link>
          </ListItem>
        </UnorderedList>

        <Text fontSize="13px">© 2024 Africa Rangeland Watch</Text>
      </Flex>
    </Box>
  );
}
