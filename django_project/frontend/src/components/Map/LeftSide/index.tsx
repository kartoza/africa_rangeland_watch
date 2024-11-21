import React, {
  forwardRef,
  useEffect,
  useImperativeHandle
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
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store";
import { fetchLandscapes } from '../../../store/landscapeSlice';
import { fetchLayers } from '../../../store/layerSlice';
import Layers, { LayerCheckboxProps } from "./Layers";
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
    const dispatch = useDispatch<AppDispatch>();
    // Required data
    const { landscapes } = useSelector((state: RootState) => state.landscape);
    const { layers } = useSelector((state: RootState) => state.layer);

    useEffect(() => {
      dispatch(fetchLayers())
      dispatch(fetchLandscapes())
    }, [dispatch])

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

