import { Helmet } from "react-helmet";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Flex, Text, Heading, Box, Image, Button, Input, Textarea, Grid, useBreakpointValue, Link } from "@chakra-ui/react";
import React from "react";


type ImageItem = {
  src: string;
  title: string;
};

type SectionProps = {
  title: string;
  items: ImageItem[];
  imageWidth: string;
  imageHeight: string;
};

const Section: React.FC<SectionProps> = ({ title, items, imageWidth, imageHeight }) => {
  return (
    <Box mb={15} mt={20}>
      {/* Section Title */}
      <Heading as="h2" fontSize="2xl" color="black" mb={10} textAlign="center">
        {title}
      </Heading>

      {/* Check if items exist, otherwise show 'No data available' */}
      {items.length > 0 ? (
        <Grid
          templateColumns={{
            base: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: items.length === 4 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
          }}
          gap={6}
          justifyContent="center"
        >
          {items.map((item, index) => (
            <Box key={index} textAlign="center">
              {/* Image */}
              <Image
                src={item.src}
                alt={item.title}
                width={imageWidth}
                height={imageHeight}
                objectFit="cover"
                borderRadius="md"
                boxShadow="md"
                ml={{ base: "20px" }}
              />
              {/* Title */}
              <Text mt={2} color="black" fontSize="md" fontWeight="bold">
                {item.title}
              </Text>
            </Box>
          ))}
        </Grid>
      ) : (
        <Flex justify="center" align="center" height="200px">
          <Text fontSize="lg" fontWeight="bold" color="gray.500">
            No data available
          </Text>
        </Flex>
      )}
    </Box>
  );
};


export default function ResourcesPage() {
  const caseStudies: ImageItem[] = [
  ];

  const policyBriefs: ImageItem[] = [
  ];

  const conservationNews: ImageItem[] = [
  ];

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


      <Box maxWidth="1200px" mx="auto" p={5}>
        {/* Case Studies Section */}
        <Section
          title="Case Studies"
          items={caseStudies}
          imageWidth="345px"
          imageHeight="426px"
        />

        {/* Policy Briefs Section */}
        <Section
          title="Policy Briefs"
          items={policyBriefs}
          imageWidth="345px"
          imageHeight="426px"
        />

        {/* Conservation News Section */}
        <Section
          title="Conservation News"
          items={conservationNews}
          imageWidth="470px"
          imageHeight="426px"
        />
      </Box>

      


      {/* Footer */}
      <Footer />
    </>
  );
}
