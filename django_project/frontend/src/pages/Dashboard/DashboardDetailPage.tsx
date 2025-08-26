import React from "react";
import { useParams } from 'react-router-dom';
import {
  Box, Flex,
} from "@chakra-ui/react";
import Header from "../../components/Header";
import { Helmet } from "react-helmet";
import Footer from "../../components/Footer";
import DynamicDashboard from "../../components/Dashboard";
import Sidebar from "../../components/SideBar";

interface DashboardDetailProps {
  readOnly: boolean;
}

const DashboardDetailPage: React.FC<DashboardDetailProps> = ({readOnly}) => {
    const { uuid } = useParams();

    return (
        <>
        <Box width="100%" minHeight={{base: "auto", md:"80vh"}}>
            <Helmet>
            <title>Dashboard | Africa Rangeland Watch | Sustainable Management</title>
            <meta name="description" content="dashboard data." />
            </Helmet>
    
            <Header />

            <Flex direction={{ base: "column", md: "row" }} align="start">
              {/* Sidebar on md+ */}
              {!readOnly && (
                <Box display={{ base: "none", md: "block" }} w="286px" flexShrink={0}>
                  <Sidebar />
                </Box>
              )}

              {/* Dashboard Component */}
              <Box flex="1" overflow="auto">
                <DynamicDashboard uuid={uuid!} isEditable={!readOnly} />
              </Box>
            </Flex>

        </Box>
        <Footer />
        </>
    )

};


export default DashboardDetailPage;