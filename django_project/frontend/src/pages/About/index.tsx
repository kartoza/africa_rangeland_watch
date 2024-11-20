import { Helmet } from "react-helmet";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Flex, Text, Heading, Box, Image, Button, Input, Textarea } from "@chakra-ui/react";
import React, { useState } from "react";

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>Home | Africa Rangeland Watch | Sustainable Management</title>
        <meta
          name="description"
          content="Explore the Africa Rangeland Watch to understand and monitor the impact of sustainable rangeland management. Access maps, dashboards, and more."
        />
      </Helmet>

      {/* Main container with background image */}
      <Box
        h={{ md: "60vh", base: "70vh" }}
        bgImage="url('/static/dashboard/dashboard_image1.svg')"
        bgSize="cover"
        bgPosition="center"
        bgRepeat="no-repeat"
        w="100%"
        position="relative"
      >
        {/* Header */}
        <Header />

        {/* Content overlaying the background image */}
        <Flex
          h="100%"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          p={{ base: "20px", md: "50px" }}
        >
          {/* Title and Description */}
          <Flex
            flexDirection="column"
            alignItems="center"
            textAlign="center"
            maxW={{ base: "90%", md: "60%" }}
            mb={{ base: "30px", md: "50px" }}
          >
            <Heading as="h1" fontSize={{ base: "24px", md: "48px" }} color="white" mb="30px">
              Africa Rangeland Watch
            </Heading>
            <Text
              fontSize={{ base: "16px", md: "24px" }}
              lineHeight="1.5"
              color="white"
              mb="32px"
              fontWeight="bold"
            >
              Understand and monitor the impact of sustainable <br /> rangeland management in Africa.
            </Text>
          </Flex>
        </Flex>
      </Box>

      {/* Section with text below the image */}
      <Box bg="gray.100" py="50px" px="20px" textAlign="center">
        <Text fontSize="18px" maxW="80%" mx="auto" color="gray.700">
          Rangeland Explorer is designed to be a rangeland monitoring and decision support tool for
          managers and conservation planners in southern Africa. It originated out of work with Meat
          Naturally in the Uzimbuvu Catchment, Eastern Cape, to gather satellite data on baseline
          rangeland condition variables. Deploying the satellite data in a web application stimulates
          interaction with the data and enhances the insight that can be gained.
          <br />
          <br />
          Rangeland Explorer is designed to be a rangeland monitoring and decision support tool for
          managers and conservation planners in southern Africa. It originated out of work with Meat
          Naturally in the Uzimbuvu Catchment, Eastern Cape, to gather satellite data on baseline
          rangeland condition variables. Deploying the satellite data in a web application stimulates
          interaction with the data and enhances the insight that can be gained.
          <br />
          <br />
          Rangeland Explorer is designed to be a rangeland monitoring and decision support tool for
          managers and conservation planners in southern Africa. It originated out of work with Meat
          Naturally in the Uzimbuvu Catchment, Eastern Cape, to gather satellite data on baseline
          rangeland condition variables. Deploying the satellite data in a web application stimulates
          interaction with the data and enhances the insight that can be gained.
        </Text>
      </Box>

      {/* Green ribbon section */}
      <Box
        bg="green.500"
        h="322px"
        w="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        mb="50px"
      >
        <Text fontSize="24px" fontWeight="bold" color="white">
          Sustainable Rangeland Management
        </Text>
      </Box>

      {/* The Goal Section */}
      <Box py="50px" textAlign="center">
        <Heading as="h2" fontSize="36px" color="black" fontWeight="bold" mb="30px">
          The Goal
        </Heading>
        <Flex justify="space-evenly" wrap="wrap">
          {/* Icons with titles */}
          <Box textAlign="center" mb="20px">
            <Image src="/path/to/icon1.png" boxSize="219px" mb="15px" />
            <Text fontSize="18px" fontWeight="bold" color="black">
              Goal 1
            </Text>
          </Box>
          <Box textAlign="center" mb="20px">
            <Image src="/path/to/icon2.png" boxSize="219px" mb="15px" />
            <Text fontSize="18px" fontWeight="bold" color="black">
              Goal 2
            </Text>
          </Box>
          <Box textAlign="center" mb="20px">
            <Image src="/path/to/icon3.png" boxSize="219px" mb="15px" />
            <Text fontSize="18px" fontWeight="bold" color="black">
              Goal 3
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* YouTube Video Section */}
      <Box py="50px" px="20px">
        <Heading as="h2" fontSize="36px" color="black" fontWeight="bold" mb="30px" textAlign="center">
          Watch Our Videos
        </Heading>
        <Flex justify="space-evenly" wrap="wrap">
          <Box width={{ base: "100%", md: "30%" }} mb="20px">
            <iframe
              width="100%"
              height="315"
              src="https://www.youtube.com/embed/example1"
              frameBorder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </Box>
          <Box width={{ base: "100%", md: "30%" }} mb="20px">
            <iframe
              width="100%"
              height="315"
              src="https://www.youtube.com/embed/example2"
              frameBorder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </Box>
          <Box width={{ base: "100%", md: "30%" }} mb="20px">
            <iframe
              width="100%"
              height="315"
              src="https://www.youtube.com/embed/example3"
              frameBorder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </Box>
        </Flex>
      </Box>

      {/* Contact Us Section */}
      <Box bg="gray.100" py="50px" px="20px">
        <Heading as="h2" fontSize="36px" color="black" fontWeight="bold" mb="30px" textAlign="center">
          Contact Us
        </Heading>
        <Flex justify="center">
          <Box width={{ base: "100%", md: "50%" }}>
            <form>
              <Box mb="20px">
                <Input
                  placeholder="Your Name"
                  size="lg"
                  bg="white"
                  border="1px solid gray"
                  mb="20px"
                  _focus={{ borderColor: "green.500" }}
                />
                <Input
                  placeholder="Your Email"
                  size="lg"
                  bg="white"
                  border="1px solid gray"
                  mb="20px"
                  _focus={{ borderColor: "green.500" }}
                />
              </Box>
              <Box mb="20px">
                <Textarea
                  placeholder="Your Message"
                  size="lg"
                  bg="white"
                  border="1px solid gray"
                  _focus={{ borderColor: "green.500" }}
                />
              </Box>
              <Button colorScheme="green" size="lg" width="100%">
                Send Message
              </Button>
            </form>
          </Box>
        </Flex>
      </Box>

      {/* Footer */}
      <Footer />
    </>
  );
}
