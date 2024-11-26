import { Helmet } from "react-helmet";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Flex, Text, Heading, Box, Image, Button, Input, Textarea, Center } from "@chakra-ui/react";
import React from "react";

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
        bgImage="url('/static/dashboard/dashboard_image2.svg')"
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
      <Box
        bg="gray.100"
        py="50px"
        px="20px"
        textAlign="center"
        height={{ base: "350px", md: "auto" }}
        overflowY="auto"
      >
        <Text fontSize="18px" maxW="60%" mx="auto" color="gray.700">
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
        bg="dark_green.800"
        h="322px"
        w="auto"
        display="flex"
        justifyContent="center"
        alignItems="center"
        mb="50px"
      >
        <Text
          fontSize={{ base: "20px", md: "24px" }}
          fontWeight="bold"
          color="white"
          textAlign="center"
        >
          Sustainable Rangeland Management
        </Text>
      </Box>


      {/* The Goal Section */}
      <Box py="50px" textAlign="center">
        <Heading as="h2" fontSize="36px" color="black" fontWeight="bold" mb="30px">
          The Goal
        </Heading>
        <Box py="50px" textAlign="center" bg="white">
          <Text fontSize="18px" color="gray.800" maxW="970px" mx="auto" mb="30px">
            The African Rangeland Watch Platform was developed to allow for easier rangeland monitoring and to be a decision support tool for managers and conservation planners in southern Africa.
          </Text>
        </Box>
        <Flex justify="space-between" wrap="wrap" gap={{ base: "20px", md: "40px" }}>
          {/* Icons with titles */}
          <Box textAlign="center"  justifyContent="center" mb="20px" width={{ base: "100%", md: "23%" }}>
            <Image ml={{base: "100px", md:"130px"}} src="static/images/analytics_icon.svg" boxSize="219px" mb="15px" />
            <Text fontSize="18px" fontWeight="bold" color="black">
              Rangeland Monitoring
            </Text>
          </Box>
          <Box textAlign="center" mb="20px" width={{ base: "100%", md: "23%" }}>
            <Image ml={{base: "100px", md:"130px"}} src="static/images/analytics_icon.svg" boxSize="219px" mb="15px"/>
            <Text fontSize="18px" fontWeight="bold" color="black">
              Gather satellite data on baseline rangeland conditions
            </Text>
          </Box>
          <Box textAlign="center" mb="20px" width={{ base: "100%", md: "23%" }}>
            <Image ml={{base: "100px", md:"110px"}} src="static/images/dashboard_and_reports.svg" boxSize="219px" mb="15px" />
            <Text fontSize="18px" fontWeight="bold" color="black">
              Dashboards and Reporting
            </Text>
          </Box>
          <Box textAlign="center" mb="20px" width={{ base: "100%", md: "23%" }}>
            <Image ml={{base: "100px", md:"120px"}} src="static/images/interactive_map_icon.svg" boxSize="219px" mb="15px" />
            <Text fontSize="18px" fontWeight="bold" color="black">
              Interactive map analysis
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
          <Box width={{ base: "100%", md: "60%" }}>
            <form>
              {/* First Row - Name and Last Name */}
              <Flex mb="20px" justify="space-between" flexWrap="wrap">
                <Box width={{ base: "100%", md: "48%" }} mb={{ base: "20px", md: "0" }}>
                  <Text fontWeight="bold" mb="8px" color="gray.700">First Name</Text>
                  <Input
                    placeholder="First Name"
                    size="lg"
                    bg="white"
                    border="1px solid gray"
                    mb="20px"
                    _focus={{ borderColor: "green.500" }}
                  />
                </Box>
                <Box width={{ base: "100%", md: "48%" }} mb={{ base: "20px", md: "0" }}>
                  <Text fontWeight="bold" mb="8px" color="gray.700">Last Name</Text>
                  <Input
                    placeholder="Last Name"
                    size="lg"
                    bg="white"
                    border="1px solid gray"
                    mb="20px"
                    _focus={{ borderColor: "green.500" }}
                  />
                </Box>
              </Flex>

              {/* Second Row - Email and Organisation */}
              <Flex mb="20px" justify="space-between" flexWrap="wrap">
                <Box width={{ base: "100%", md: "48%" }} mb={{ base: "20px", md: "0" }}>
                  <Text fontWeight="bold" mb="8px" color="gray.700">Email</Text>
                  <Input
                    placeholder="Your Email"
                    size="lg"
                    bg="white"
                    border="1px solid gray"
                    mb="20px"
                    _focus={{ borderColor: "green.500" }}
                  />
                </Box>
                <Box width={{ base: "100%", md: "48%" }} mb={{ base: "20px", md: "0" }}>
                  <Text fontWeight="bold" mb="8px" color="gray.700">Organisation</Text>
                  <Input
                    placeholder="Organisation"
                    size="lg"
                    bg="white"
                    border="1px solid gray"
                    mb="20px"
                    _focus={{ borderColor: "green.500" }}
                  />
                </Box>
              </Flex>

              {/* Third Row - Additional Details */}
              <Box mb="20px">
                <Text fontWeight="bold" mb="8px" color="gray.700">Additional Details</Text>
                <Textarea
                  placeholder="Provide additional details"
                  size="lg"
                  bg="white"
                  border="1px solid gray"
                  _focus={{ borderColor: "green.500" }}
                  height="200px"
                  resize="vertical"
                />
              </Box>


              {/* Button Section - Placing Button on Right */}
              <Flex justify="flex-end">
                <Button
                    backgroundColor="dark_green.800"
                    _hover={{ backgroundColor: "light_green.400" }}
                    fontWeight={700}
                    w="20%"
                    color="white.a700"
                    borderRadius={5}
                    p={4}
                  >
                    Submit
                </Button>
              </Flex>
            </form>
          </Box>
        </Flex>
      </Box>

      {/* Footer */}
      <Footer />
    </>
  );
}
