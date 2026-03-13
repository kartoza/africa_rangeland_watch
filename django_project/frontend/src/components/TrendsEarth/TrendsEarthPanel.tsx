// coding=utf-8
/**
 * TrendsEarthPanel.tsx
 * Main panel with 5 tabs: LDN, Drought, Urbanization, Population,
 * and Trends.Earth Account.
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchLandscapes } from '../../store/landscapeSlice';
import LdnTab from './tabs/LdnTab';
import DroughtTab from './tabs/DroughtTab';
import UrbanizationTab from './tabs/UrbanizationTab';
import PopulationTab from './tabs/PopulationTab';
import TrendsEarthAccountForm from './TrendsEarthAccountForm';

const ACCOUNT_TAB_INDEX = 4;

const TrendsEarthPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const landscapes = useSelector(
    (state: RootState) => state.landscape.landscapes
  );
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    if (landscapes.length === 0) {
      dispatch(fetchLandscapes());
    }
  }, [dispatch]);

  const navigateToAccount = () => setTabIndex(ACCOUNT_TAB_INDEX);

  return (
    <Box>
      <Tabs
        index={tabIndex}
        onChange={(idx) => setTabIndex(idx)}
        variant="enclosed"
        colorScheme="green"
      >
        <TabList>
          <Tab
            fontWeight="bold"
            color="black"
            _selected={{ color: 'white', bg: 'dark_green.800' }}
          >
            Land Degradation
          </Tab>
          <Tab
            fontWeight="bold"
            color="black"
            _selected={{ color: 'white', bg: 'dark_green.800' }}
          >
            Drought
          </Tab>
          <Tab
            fontWeight="bold"
            color="black"
            _selected={{ color: 'white', bg: 'dark_green.800' }}
          >
            Urbanization
          </Tab>
          <Tab
            fontWeight="bold"
            color="black"
            _selected={{ color: 'white', bg: 'dark_green.800' }}
          >
            Population
          </Tab>
          <Tab
            fontWeight="bold"
            color="black"
            _selected={{ color: 'white', bg: 'dark_green.800' }}
          >
            Trends.Earth Account
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <LdnTab onNavigateToAccount={navigateToAccount} />
          </TabPanel>
          <TabPanel>
            <DroughtTab onNavigateToAccount={navigateToAccount} />
          </TabPanel>
          <TabPanel>
            <UrbanizationTab onNavigateToAccount={navigateToAccount} />
          </TabPanel>
          <TabPanel>
            <PopulationTab onNavigateToAccount={navigateToAccount} />
          </TabPanel>
          <TabPanel>
            <TrendsEarthAccountForm />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default TrendsEarthPanel;
