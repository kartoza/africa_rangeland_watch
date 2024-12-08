import React from "react";
import Header from "../../components/Header";
import { Helmet } from "react-helmet";
import { Flex, Text, Heading, Box, Image, Link } from "@chakra-ui/react";
import Footer from "../../components/Footer";

const LearnMore: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Learn More | Africa Rangeland Watch</title>
        <meta name="description" content="Learn more about herding for health." />
      </Helmet>

      {/* Main container with background image */}
      <Box
        h={{ md: "60vh", base: "70vh" }}
        bgImage="url('/static/dashboard/dashboard_image3.svg')"
        bgRepeat="no-repeat"
        bgSize="cover"
        position="relative"
      >
        {/* Header */}
        <Header />

        <Flex
          h="100%"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          p={{ base: "20px", md: "50px" }}
        >
          {/* Title */}
          <Flex
            flexDirection="column"
            alignItems="center"
            textAlign="center"
            maxW={{ base: "90%", md: "60%" }}
            mb={{ base: "30px", md: "50px" }}
          >
            <Heading
              as="h1"
              fontSize={{ base: "24px", md: "48px" }}
              color="white"
              mb="30px"
            >
              Learn More about Herding for Health
            </Heading>
          </Flex>
        </Flex>
      </Box>

      {/* Content Section */}
      <Box
        bg="gray.100"
        py={{ base: "30px", md: "50px" }}
        px={{ base: "20px", md: "40px" }}
        textAlign="left"
        height={{base: "auto", md:"50vh"}}
      >
        <Box
          w={{ base: "100%", md: "70%" }}
          mx="auto" // Center the box
        >
          <Flex
            direction={{ base: "column", md: "row" }}
            align="start"
            gap={{ base: "20px", md: "40px" }}
          >
            {/* Image Section */}
            <Image
              src="/static/images/learn_more_health.svg"
              alt="Herding for Health"
              maxWidth={{ base: "100%", md: "470px" }}
              height={{ base: "auto", md: "332px" }}
              objectFit="cover"
            />

            {/* Content Section */}
            <Box>
              {/* Heading */}
              <Text
                fontSize={{ base: "18px", md: "20px" }}
                fontWeight="bold"
                color="black"
                mb="10px"
              >
                What is Herding for Health?
              </Text>

              {/* Paragraph */}
              <Text
                fontSize={{ base: "14px", md: "16px" }}
                color="gray.700"
                mb="10px"
              >
                The aim of this joint initiative of Conservation International
                and Peace Parks Foundation is to restore high biodiversity
                indigenous grasslands, savanna, and shrublands, improve animal
                health, and provide market access while promoting biodiversity
                conservation in and around protected areas in Africa.
              </Text>

              {/* External Link */}
              <Text fontSize={{ base: "14px", md: "16px" }} color="blue.500" mb="10px">
                Visit:{" "}
                <Link
                  href="https://www.conservation.org/projects/herding-for-health"
                  color="blue.600"
                  isExternal
                >
                  https://www.conservation.org/projects/herding-for-health
                </Link>
              </Text>

              {/* PDF Link */}
              <Text fontSize={{ base: "14px", md: "16px" }} color="gray.700">
                Read Pamphlet here:{" "}
                <Link
                  href="/static/Herding.for.Health.pdf"
                  color="blue.600"
                  isExternal
                >
                  Herding for Health
                </Link>
              </Text>
            </Box>
          </Flex>
        </Box>
      </Box>

      <Footer />
    </>
  );
};

export default LearnMore;
