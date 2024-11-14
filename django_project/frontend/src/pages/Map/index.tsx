import React from "react";
import { Helmet } from "react-helmet";
import Header from "../../components/Header";
import { Box } from "@chakra-ui/react";
import LeftSide from "../../components/Map/LeftSide";
import MapLibre from "../../components/Map/MapLibre";
import TopSide from "../../components/Map/TopSide";


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
        h='100vh'
        w="100vw"
        display='flex'
        flexDirection='column'
      >
        {/* Header */}
        <Header/>
        <Box flexGrow={1} display='flex' minHeight={0}>
          <LeftSide/>
          <Box
            flexGrow={1}
            display='flex'
            flexDirection='column'
          >
            <TopSide/>
            <MapLibre/>
          </Box>
        </Box>
      </Box>
    </>
  );
}
