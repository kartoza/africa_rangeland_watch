import React from "react";
import { useRoutes } from "react-router-dom";
import HomePage from "./pages/Home/index";
import NotFound from "./pages/NotFound";
import ProfileInformationPage from "./pages/Profile";
import OrganisationInformation from "./pages/OrganisationInformation";
import UploadedResourcesPage from "./pages/UploadedResources";
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
      path: "/uploaded-resources",
      element: <PrivateRoute Component={UploadedResourcesPage} />,
    },
  ]);

  return routes;
};

export default ProjectRoutes;
