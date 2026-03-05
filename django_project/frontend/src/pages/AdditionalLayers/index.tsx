// coding=utf-8
/**
 * AdditionalLayers page
 * Hosts the TrendsEarthPanel (LDN, Drought, Urbanization, Population tabs).
 */
import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { Helmet } from 'react-helmet';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Sidebar from '../../components/SideBar';
import TrendsEarthPanel from '../../components/TrendsEarth/TrendsEarthPanel';

const AdditionalLayersPage: React.FC = () => {
  return (
    <>
      <Box width="100%" minHeight={{ base: 'auto', md: '80vh' }}>
        <Helmet>
          <title>Additional Layers | Africa Rangeland Watch</title>
          <meta
            name="description"
            content="Run Trends.Earth analyses: Land Degradation Neutrality, Drought, Urbanization, and Population."
          />
        </Helmet>

        <Header />

        <Flex direction={{ base: 'column', md: 'row' }} align="start" gap="30px">
          {/* Desktop sidebar */}
          <Box
            display={{ base: 'none', md: 'block' }}
            w="286px"
            flexShrink={0}
          >
            <Sidebar w="full" />
          </Box>

          {/* Main content */}
          <Box flex="1" overflow="auto" p={5}>
            <TrendsEarthPanel />
          </Box>
        </Flex>

        <Footer />
      </Box>
    </>
  );
};

export default AdditionalLayersPage;
