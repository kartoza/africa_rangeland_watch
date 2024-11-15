import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState
} from 'react';
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
import { Layer, SelectOption } from "../DataTypes";
import { Landscapes } from "../fixtures/analysis";
import { layerData } from "../fixtures/layer";
import Analysis from "./Analysis";

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

    // Required data
    const [landscapes, setLandscapes] = useState<Array<SelectOption> | null>(null);
    const [layers, setLayers] = useState<Array<Layer> | null>(null);

    // TODO:
    //  Fetch the data here
    useEffect(() => {
      setLandscapes(Landscapes)
      setLayers(layerData)
    }, []);

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
                <Layers
                  landscapes={landscapes}
                  layers={layers}
                  {...props}
                />
              </TabPanel>
              <TabPanel padding={0} textAlign='center'>
                <Analysis
                  landscapes={landscapes}
                  layers={layers}
                />
              </TabPanel>
            </TabPanels>
          </Box>
        </Tabs>
      </Box>
    )
  }
)

