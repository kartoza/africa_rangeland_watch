// coding=utf-8
/**
 * TrendsEarthPanel.tsx
 * Main panel with 5 tabs: LDN, Drought, Urbanization, Population,
 * and Trends.Earth Account.
 */
import React, { useState } from 'react';
import {
  Box,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import LdnTab from './tabs/LdnTab';
import DroughtTab from './tabs/DroughtTab';
import UrbanizationTab from './tabs/UrbanizationTab';
import PopulationTab from './tabs/PopulationTab';
import TrendsEarthAccountForm from './TrendsEarthAccountForm';

const ACCOUNT_TAB_INDEX = 4;

const TrendsEarthPanel: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);

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
