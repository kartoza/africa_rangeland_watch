import React, { forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure
} from "@chakra-ui/react";
import Layers, { LayerCheckboxProps } from "./Layers";

const styles = {
  SelectedTab: {
    color: "dark_green.800",
    borderBottomColor: "dark_green.800"
  }
}


/** LeftSide component of map. */
export const LeftSide = forwardRef(
  (props: LayerCheckboxProps, ref
  ) => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    // Toggle
    useImperativeHandle(ref, () => ({
      toggle() {
        if (isOpen) {
          onClose()
        } else {
          onOpen()
        }
      }
    }));

    return (
      <Box
        marginLeft={isOpen ? '-300px' : '0'}
        width='300px'
        height='100%'
        borderRight='1px solid #DDD'
        style={{
          transition: "margin-left 0.2s"
        }}
      >
        <Tabs
          isFitted
          variant="enclosed"
          display='flex'
          flexDirection='column'
          height='100%'
        >
          <TabList>
            <Tab
              height='52px'
              boxSizing='border-box'
              fontSize='13px'
              padding={4}
              fontWeight='bold'
              _selected={styles.SelectedTab}
            >
              Layers
            </Tab>
            <Tab
              height='52px'
              boxSizing='border-box'
              fontSize='13px'
              padding={4}
              fontWeight='bold'
              _selected={styles.SelectedTab}
            >
              Analysis
            </Tab>
          </TabList>
          <Box flexGrow={1} minHeight={0}>
            <TabPanels overflow='auto' height='100%'>
              <TabPanel padding={0}>
                <Layers {...props}/>
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
)

