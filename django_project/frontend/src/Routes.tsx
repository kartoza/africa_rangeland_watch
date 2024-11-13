import React from "react";
import { useRoutes } from "react-router-dom";
import HomePage from "./pages/Home/index";
import NotFound from "./pages/NotFound";
import ProfileInformationPage from "./pages/Profile";
import AnalysisResults from "./pages/AnalysisResults";
import OrganisationInformation from "./pages/OrganisationInformation";
import PrivateRoute from "./PrivateRoute";

const ProjectRoutes = () => {
  const routes = useRoutes([
    { path: "/", element: <HomePage /> },
    { path: "*", element: <NotFound /> },
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
      path: "/analysis-results",
      element: <PrivateRoute Component={AnalysisResults} />,
    },
  ]);

  return routes;
};

export default ProjectRoutes;
