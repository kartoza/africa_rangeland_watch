import React, { Suspense } from "react";
import { useRoutes } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";

const Center = React.lazy(() => import("@chakra-ui/react").then(module => ({ default: module.Center })));
const Spinner = React.lazy(() => import("@chakra-ui/react").then(module => ({ default: module.Spinner })));

const HomePage = React.lazy(() => import("./pages/Home/index"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const ProfileInformationPage = React.lazy(() => import("./pages/Profile"));
const OrganisationInformation = React.lazy(() => import("./pages/OrganisationInformation"));
const AnalysisResults = React.lazy(() => import("./pages/AnalysisResults"));
const NotificationsPage  = React.lazy(() => import("./pages/Notifications"));
const UploadedResourcesPage  = React.lazy(() => import("./pages/UploadedResources"));
const SupportPage = React.lazy(() => import("./pages/Support"));
import AboutPage from "./pages/About";
import ResourcesPage from "./pages/Resources";
const DashboardPage = React.lazy(() => import("./pages/Dashboard"));
const DynamicDashboardPage = React.lazy(() => import("./pages/Dashboard/DynamicDashboard"));
const MapPage  = React.lazy(() => import("./pages/Map"));
const LearnMorePage  = React.lazy(() => import("./pages/About/LearnMore"));
const EarthRangerEventsPage = React.lazy(() => import("./pages/EarthrangerEvents"));


const ProjectRoutes = () => {
  const routes = useRoutes([
    { path: "/", element: <HomePage /> },
    { path: "*", element: <NotFound /> },
    { path: "/about", element: <AboutPage /> },
    { path: "/resources", element: <ResourcesPage /> },
    { path: "/dashboard", element: <DynamicDashboardPage /> },
    { path: "/learn-more", element: <LearnMorePage /> },
    // Use PrivateRoute for protected routes
    {
      path: "/profile",
      element: <PrivateRoute Component={ProfileInformationPage} />,
    },
    {
      path: "/organisation",
      element: <PrivateRoute Component={OrganisationInformation} />,
    },
    {
      path: "/uploaded-resources",
      element: <PrivateRoute Component={UploadedResourcesPage} />,
    },
    {
      path: "/analysis-results",
      element: <PrivateRoute Component={AnalysisResults} />,
    },
    {
      path: "/earthranger/events",
      element: <PrivateRoute Component={EarthRangerEventsPage} />,
    },
    {
      path: "/notifications",
      element: <PrivateRoute Component={NotificationsPage} />,
    },
    {
      path: "/support",
      element: <PrivateRoute Component={SupportPage} />,
    },
    {
      path: "/map",
      element: <MapPage />,
    },
  ]);

  return (
    <Suspense
      fallback={
        <Suspense fallback={<div></div>}>
          <Center h="100vh">
            <Spinner size="xl" />
          </Center>
        </Suspense>
      }
    >
      {routes}
    </Suspense>
  );
};

export default ProjectRoutes;
