import React from "react";
import { useRoutes } from "react-router-dom";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/Home/index";
import OrganisationInformation from "./pages/OrganisationInformation";
import ProfileInformationPage from "./pages/Profile";
import MapPage from "./pages/Map";

const ProjectRoutes = () => {
  const element = useRoutes([
    { path: "*", element: <NotFound /> },
    { path: "/", element: <HomePage />},
    { path: "/organisation", element: <OrganisationInformation /> },
    { path: "/profile", element: <ProfileInformationPage />},
    { path: "/map", element: <MapPage/> },
  ]);

  return element;
};

export default ProjectRoutes;
