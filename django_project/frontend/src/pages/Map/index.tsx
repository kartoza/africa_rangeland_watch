import React from "react";
import { Helmet } from "react-helmet";
import Header from "../../components/Header";
import { Box } from "@chakra-ui/react";


export default function MapPage() {

  return (
    <>
      <Helmet>
        <title>Map | Africa Rangeland Watch | Sustainable Management</title>
        <meta
          name="description"
          content="Explore the Africa Rangeland Watch to understand and monitor the impact of sustainable rangeland management. Access maps, dashboards, and more."/>
      </Helmet>
      <Box
        h='100%'
        w="100%"
      >
        {/* Header */}
        <Header/>
      </Box>
    </>
  );
}
