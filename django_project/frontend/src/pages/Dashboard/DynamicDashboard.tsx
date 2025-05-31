import React from "react";
import {
  Box
} from "@chakra-ui/react";
import Header from "../../components/Header";
import { Helmet } from "react-helmet";
import Footer from "../../components/Footer";
import DynamicDashboard from "../../components/Dashboard";


const DynamicDashboardPage: React.FC = () => {
    return (
        <>
        <Box width="100%" minHeight={{base: "auto", md:"80vh"}}>
            <Helmet>
            <title>Dashboard | Africa Rangeland Watch | Sustainable Management</title>
            <meta name="description" content="dashboard data." />
            </Helmet>
    
            <Header />

            {/* Dashboard Component */}
            <DynamicDashboard />

        </Box>
        <Footer />
        </>
    )

};


export default DynamicDashboardPage;