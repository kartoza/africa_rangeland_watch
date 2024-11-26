import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { selectIsLoggedIn } from "./store/authSlice";

interface PrivateRouteProps {
  Component: React.ComponentType;
}


const PrivateRoute = ({ Component }: PrivateRouteProps) => {
  const isAuthenticated = useSelector(selectIsLoggedIn);
  const location = useLocation();
  const token = localStorage.getItem("auth_token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      const attemptedPath = location.pathname + location.search;
      sessionStorage.setItem("redirectAfterLogin", attemptedPath);

      navigate("/")

    }
  }, [isAuthenticated, location.pathname, location.search]);

  if (isAuthenticated || token) {
    return <Component />;
  }

 
};

export default PrivateRoute;
