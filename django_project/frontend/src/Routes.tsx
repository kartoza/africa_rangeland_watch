import React from "react";
import { useRoutes } from "react-router-dom";
import HomePage from "./pages/Home/index";
import NotFound from "./pages/NotFound";
import ProfileInformationPage from "./pages/Profile";
import PrivateRoute from "./PrivateRoute";

const ProjectRoutes = () => {
  const routes = useRoutes([
    { path: "/", element: <HomePage /> },
    { path: "*", element: <NotFound /> },

    // Use PrivateRoute for protected routes
    {
      path: "/profile",
      element: <PrivateRoute Component={ProfileInformationPage} />,
    }
  ]);

  return routes;
};

export default ProjectRoutes;
