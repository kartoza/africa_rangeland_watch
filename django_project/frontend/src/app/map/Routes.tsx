import React from "react";
import { useRoutes } from "react-router-dom";
import MapPage from "../../pages/Map";
import NotFound from "../../pages/NotFound";

const ProjectRoutes = () => {
  const element = useRoutes([
    { path: "*", element: <NotFound/> },
    { path: "/", element: <MapPage/> },
  ]);

  return element;
};

export default ProjectRoutes;
