import { Helmet } from "react-helmet";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Flex, Text, Heading, Box, Image, Button, Input, Textarea, Grid, useBreakpointValue, Link } from "@chakra-ui/react";
import React from "react";


type Article = {
  title: string;
  link: string;
};

type SectionProps = {
  title: string;
  articles: Article[];
};

const Section: React.FC<SectionProps> = ({ title, articles }) => {
  return (
    <Box mb={10}>
      <Heading as="h2" fontSize="2xl" mb={6} textAlign="center">
        {title}
      </Heading>
      <Grid
        templateColumns={{
          base: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        }}
        gap={6}
      >
        {articles.map((article, index) => (
          <Box
            key={index}
            bg="teal.50"
            p={5}
            borderRadius="md"
            boxShadow="md"
            _hover={{ boxShadow: 'lg', bg: 'teal.100' }}
          >
            <Text
              fontSize="lg"
              fontWeight="bold"
              isTruncated
              noOfLines={2}
              mb={3}
            >
              {article.title}
            </Text>
            <Link
              href={article.link}
              color="teal.600"
              fontWeight="medium"
              _hover={{ textDecoration: 'underline' }}
            >
              Read More
            </Link>
          </Box>
        ))}
      </Grid>
    </Box>
  );
};

export default function ResourcesPage() {
  const articles = [
    { title: 'Innovative Finance in Namakwa', link: '#' },
    { title: 'Small Grants Facility in Namakwa', link: '#' },
    { title: 'Low-cost erosion control in Namakwa', link: '#' },
    {
      title:
        'Case study title will go here and if it goes over into the next line this is what it will look like',
      link: '#',
    },
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
        <Section title="Case Studies" articles={articles} />
        <Section title="Policy Briefs" articles={articles} />
        <Section title="Conservation News" articles={articles} />
      </Box>

      


      {/* Footer */}
      <Footer />
    </>
  );
}
