import React from "react";
import { useRoutes } from "react-router-dom";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/Home/index";
import OrganisationInformation from "./pages/OrganisationInformation";

const ProjectRoutes = () => {
  const element = useRoutes([
    { path: "*", element: <NotFound /> },
    { path: "/", element: <HomePage />},
    { path: "/organisation", element: <OrganisationInformation /> }
  ]);

  return element;
};

export default ProjectRoutes;
