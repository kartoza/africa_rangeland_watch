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
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store";
import { fetchLandscapes } from '../../../store/landscapeSlice';
import { fetchLayers } from '../../../store/layerSlice';
import { selectIsLoggedIn } from "../../../store/authSlice";
import { fetchAnalysisIndicator } from '../../../store/analysisSlice';
import Layers, { LayerCheckboxProps } from "./Layers";
import Analysis from "./Analysis";
import { useSession } from '../../../sessionProvider'

const styles = {
  SelectedTab: {
    color: "dark_green.800",
    borderBottomColor: "dark_green.800"
  }
};

/** LeftSide component of map. */
export const LeftSide = forwardRef((props: LayerCheckboxProps, ref) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const dispatch = useDispatch<AppDispatch>();
  const { landscapes } = useSelector((state: RootState) => state.landscape);
  const { layers } = useSelector((state: RootState) => state.layer);
  const isAuthenticated = useSelector(selectIsLoggedIn);
  const { loadingSession, session } = useSession();

  // Track the active tab index (0 = Layers, 1 = Analysis)
  const [tabIndex, setTabIndex] = useState(0);

  // Automatically select the "Analysis" tab if session.analysisState exists
  useEffect(() => {
    if (!loadingSession && session && session?.analysisState) {
      setTabIndex(1);
    }else{
      setTabIndex(0);
    }
  }, [loadingSession]);

  // Fetch required data on mount
  useEffect(() => {
    dispatch(fetchLayers());
    dispatch(fetchLandscapes());
    dispatch(fetchAnalysisIndicator());
  }, [dispatch]);

  // Toggle LeftSide visibility
  useImperativeHandle(ref, () => ({
    toggle() {
      if (isOpen) {
        onClose();
      } else {
        onOpen();
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
        index={tabIndex}
        onChange={(index) => setTabIndex(index)}
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
          {isAuthenticated && (
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
          )}
        </TabList>
        <Box flexGrow={1} minHeight={0}>
          <TabPanels overflow='auto' height='100%'>
            <TabPanel padding={0}>
              <Layers landscapes={landscapes} layers={layers} {...props} />
            </TabPanel>
            {isAuthenticated && (
              <TabPanel padding={0} textAlign='center'>
                <Analysis landscapes={landscapes} layers={layers} {...props} />
              </TabPanel>
            )}
          </TabPanels>
        </Box>
      </Tabs>
    </Box>
  );
});