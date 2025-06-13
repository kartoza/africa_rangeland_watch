import React from "react";
import { useParams } from 'react-router-dom';
import {
  Box
} from "@chakra-ui/react";
import Header from "../../components/Header";
import { Helmet } from "react-helmet";
import Footer from "../../components/Footer";
import DynamicDashboard from "../../components/Dashboard";


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

            {/* Dashboard Component */}
            <DynamicDashboard uuid={uuid} isEditable={!readOnly} />

        </Box>
        <Footer />
        </>
    )

};


export default DashboardDetailPage;