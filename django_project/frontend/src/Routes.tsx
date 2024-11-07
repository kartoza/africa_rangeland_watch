import React from "react";
import { useRoutes } from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/Home/index";
import ProfileInformationPage from "./pages/Profile";

const ProjectRoutes = () => {
  const element = useRoutes([
    { path: "", element: <NotFound /> },
    { path: "/routes", element: <Home /> },
    { path: "/home", element: <HomePage />},
    { path: "/profile", element: <ProfileInformationPage />}
  ]);

  return element;
};

export default ProjectRoutes;
