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
            HELP
          </Heading>
          <UnorderedList styleType="none" spacing={1}>
            <ListItem>
              <Link href="#" fontSize="14px" fontWeight="bold" color="white">
                Dummy Link 1
              </Link>
            </ListItem>
            <ListItem>
              <Link href="#" fontSize="14px" fontWeight="bold" color="white">
                Dummy Link 2
              </Link>
            </ListItem>
          </UnorderedList>
        </Box>

        {/* Column 2: About Us */}
        <Box
          flexBasis={{ base: "100%", md: "25%" }}
          textAlign="center"
          minH="120px"
        >
          <Heading size="lg" mb="2" fontWeight="bold" color="white">
            ABOUT US
          </Heading>
          <UnorderedList styleType="none" spacing={1}>
            <ListItem>
              <Link
                href="#/about"
                fontSize="14px"
                fontWeight="bold"
                color="white"
              >
                Africa Rangeland Watch
              </Link>
            </ListItem>
            <ListItem>
              <Link href="#" fontSize="14px" fontWeight="bold" color="white">
                Conservation South Africa
              </Link>
            </ListItem>
          </UnorderedList>
        </Box>

        {/* Column 3: Resources */}
        <Box
          flexBasis={{ base: "100%", md: "25%" }}
          textAlign="center"
          minH="100px"
        >
          <Heading size="lg" mb="2" fontWeight="bold" color="white">
            RESOURCES
          </Heading>
          <UnorderedList styleType="none" spacing={1}>
            <ListItem>
              <Link href="#" fontSize="14px" fontWeight="bold" color="white">
                ARW Documentation
              </Link>
            </ListItem>
            <ListItem>
              <Link href="#" fontSize="14px" fontWeight="bold" color="white">
                Policy Briefs
              </Link>
            </ListItem>
            <ListItem>
              <Link href="#" fontSize="14px" fontWeight="bold" color="white">
                Case Studies
              </Link>
            </ListItem>
            <ListItem>
              <Link href="#" fontSize="14px" fontWeight="bold" color="white">
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
      >
        <Image src="/static/images/main_logo.svg" alt="Footer Logo" h="58px" />

        <UnorderedList styleType="none" display="flex" justifyContent="center" flexWrap="wrap" gap="20px">
          <ListItem>
            <Link href="#" fontSize="14px">Contact Us</Link>
          </ListItem>
          <ListItem>
            <Link href="#" fontSize="14px">Terms of Use</Link>
          </ListItem>
          <ListItem>
            <Link href="#" fontSize="14px">Privacy Policy</Link>
          </ListItem>
        </UnorderedList>

        <Text fontSize="14px">© 2024 Africa Rangeland Watch</Text>
      </Flex>
    </Box>
  );
}
