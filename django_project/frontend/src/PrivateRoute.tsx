import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import SignIn from "./components/SignIn";
import { selectIsLoggedIn } from "./store/authSlice";

interface PrivateRouteProps {
  Component: React.ComponentType;
}

const PrivateRoute = ({ Component }: PrivateRouteProps) => {
  const isAuthenticated = useSelector(selectIsLoggedIn);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const location = useLocation();
  const token = localStorage.getItem("auth_token");

  const handleLoginSuccess = () => {
    setIsSignInOpen(false);
    return <Component />;
  };

  

  useEffect(() => {
    if (isAuthenticated) {
      handleLoginSuccess();
    } else {
      setIsSignInOpen(true);
    }
  }, [isAuthenticated, location.pathname]);

  if (isAuthenticated || token) {
    return <Component />;
  }

  return (
    <>
      {isSignInOpen && (
        <SignIn
          isOpen={isSignInOpen}
          onClose={() => setIsSignInOpen(false)}
        />
      )}
    </>
  );
};

export default PrivateRoute;
