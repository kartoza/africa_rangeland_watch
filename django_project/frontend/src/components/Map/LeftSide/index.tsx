import React from 'react';
import {
  Box,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs
} from "@chakra-ui/react";
import Layers from "./Layers";

/** LeftSide component of map. */
export default function LeftSide() {

  return (
    <Box
      width='300px'
      height='100%'
      borderRight='1px solid #DDD'
    >
      <Tabs
        isFitted variant="enclosed"
        display='flex'
        flexDirection='column'
        height='100%'
      >
        <TabList>
          <Tab padding={4}>Layers</Tab>
          <Tab padding={4}>Analysis</Tab>
        </TabList>
        <Box flexGrow={1} minHeight={0}>
          <TabPanels overflow='auto' height='100%'>
            <TabPanel padding={0}>
              <Layers/>
            </TabPanel>
            <TabPanel padding={4} textAlign='center'>
              Coming soon
            </TabPanel>
          </TabPanels>
        </Box>
      </Tabs>
    </Box>
  )
}

