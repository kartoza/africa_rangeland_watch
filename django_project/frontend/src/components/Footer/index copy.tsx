import { ChakraProps, Text, Link, UnorderedList, ListItem, Image, Flex, Heading, Box } from "@chakra-ui/react";
import React from "react";

interface Props extends ChakraProps {
  className?: string;
}

export default function Footer(props: Props) {
  return (
    <Box bg="dark_green.800" padding="20px" color="white">
      {/* Container for columns */}
      <Flex
        flexDirection={{ base: "column", md: "row" }}
        alignItems="center"
        justifyContent="center"
        gap="20px"
        maxWidth="90%"
        mx="auto"
        mb="20px"
      >
        {/* Column 1: Help */}
        <Box
          flexBasis={{ base: "100%", md: "25%" }}
          textAlign="center"
          minH="120px"
        >
          <Heading size="lg" mb="2" fontWeight="bold" color="white">
            Help
          </Heading>
          <UnorderedList styleType="none" spacing={1}>
            <ListItem>
              <Link href="#" fontSize="13px" fontWeight="bold" color="white">
                Dummy Link 1
              </Link>
            </ListItem>
            <ListItem>
              <Link href="#" fontSize="13px" fontWeight="bold" color="white">
                Dummy Link 2
              </Link>
            </ListItem>
          </UnorderedList>
        </Box>

        {/* Column 2: About Us */}
        <Box
          flexBasis={{ base: "100%", md: "25%" }} // Full width on mobile, 25% on desktop
          textAlign="center"
          minH="120px"
        >
          <Heading size="lg" mb="2" fontWeight="bold" color="white">
            About Us
          </Heading>
          <UnorderedList styleType="none" spacing={1}>
            <ListItem>
              <Link
                href="#/about"
                fontSize="13px"
                fontWeight="bold"
                color="white"
              >
                Africa Rangeland Watch
              </Link>
            </ListItem>
            <ListItem>
              <Link href="#" fontSize="13px" fontWeight="bold" color="white">
                Conservation South Africa
              </Link>
            </ListItem>
          </UnorderedList>
        </Box>

        {/* Column 3: Resources */}
        <Box
          flexBasis={{ base: "100%", md: "25%" }} // Full width on mobile, 25% on desktop
          textAlign="center"
          minH="100px"
        >
          <Heading size="lg" mb="2" fontWeight="bold" color="white">
            Resources
          </Heading>
          <UnorderedList styleType="none" spacing={1}>
            <ListItem>
              <Link href="#" fontSize="13px" fontWeight="bold" color="white">
                ARW Documentation
              </Link>
            </ListItem>
            <ListItem>
              <Link href="#" fontSize="13px" fontWeight="bold" color="white">
                Policy Briefs
              </Link>
            </ListItem>
            <ListItem>
              <Link href="#" fontSize="13px" fontWeight="bold" color="white">
                Case Studies
              </Link>
            </ListItem>
            <ListItem>
              <Link href="#" fontSize="13px" fontWeight="bold" color="white">
                Conservation News
              </Link>
            </ListItem>
          </UnorderedList>
        </Box>
      </Flex>

      {/* Second Row */}
      <Flex
        justifyContent="space-between"
        alignItems="center"
        flexDirection={{ base: "column", md: "row" }}
        mt="20px"
        maxWidth="80%"
        mx="auto"
        gap="20px"
      >
        <Box flexShrink={0}>
          <Image
            src="/static/images/main_logo.svg"
            alt="Footer Logo"
            h={{ base: "48px", md: "58px" }}
          />
        </Box>

        {/* Links in the center */}
        <UnorderedList
          styleType="none"
          display="flex"
          justifyContent="center"
          flexWrap="wrap"
          gap="10px"
          mt={{ base: "10px", md: "0" }}
        >
          <ListItem>
            <Link href="#" fontSize="13px" color="white">
              Contact Us
            </Link>
          </ListItem>
          <ListItem>
            <Link href="#" fontSize="13px" color="white">
              Terms of Use
            </Link>
          </ListItem>
          <ListItem>
            <Link href="#" fontSize="13px" color="white">
              Privacy Policy
            </Link>
          </ListItem>
        </UnorderedList>

        <Box flexShrink={0}>
          <Text fontSize="13px" mt={{ base: "10px", md: "0" }} textAlign={{ base: "center", md: "right" }}>
            © 2024 Africa Rangeland Watch
          </Text>
        </Box>
      </Flex>

    </Box>
  );
}
