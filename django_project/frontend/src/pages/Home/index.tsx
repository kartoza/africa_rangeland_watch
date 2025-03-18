import { Helmet } from "react-helmet";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SignIn from "../../components/SignIn";
import {
  IconButton,
  Image,
  Button,
  Flex,
  Text,
  Heading,
  Box,
  useToast
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsLoggedIn } from "../../store/authSlice";

export default function HomePage() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [sectionHeight, setSectionHeight] = useState(70); // Initial height in vh
  const [isDragging, setIsDragging] = useState(false);
  
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsLoggedIn);

  // Handle mouse events
  const handleMouseDown = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: { clientY: number; }) => {
    if (!isDragging) return;
    
    // Calculate new height based on mouse movement
    const newHeight = Math.max(20, Math.min(80, (e.clientY / window.innerHeight) * 100));
    setSectionHeight(newHeight);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Redirect after successful login
   const redirectPath = sessionStorage.getItem("redirectAfterLogin");
   useEffect(() => {
    if (redirectPath) {
      setIsSignInOpen(true)
      
      if (isAuthenticated){
        sessionStorage.removeItem("redirectAfterLogin");
        navigate(redirectPath);
      }
        
    }
  }, [isAuthenticated]);

  
  useEffect(() => {
    const url = location.search;

    if (url.includes('registration_complete=true')) {
      toast({
        title: "Registration completed",
        description: "Your registration has been completed. You may now login.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
        containerStyle: {
          backgroundColor: "#00634b",
          color: "white",
        },
      });
    } else if (url.includes('invitation_accepted=true')) {
      toast({
        title: "Inviation Accepted",
        description: "Thank you for accepting the invitation. You are now a member of the organisation. Proceed to login.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
        containerStyle: {
          backgroundColor: "#00634b",
          color: "white",
        },
      });
    } else if (url.includes('register_first=true')) {
      toast({
        title: "Registration Incomplete",
        description: "You must complete registration before being added to the organisation.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
        containerStyle: {
          backgroundColor: "red",
          color: "white",
        },
      });
    } 
  }, [location.hash]);

  return (
    <>
      <Helmet>
        <title>Home | Africa Rangeland Watch | Sustainable Management</title>
        <meta name="description" content="Explore the Africa Rangeland Watch to understand and monitor the impact of sustainable rangeland management. Access maps, dashboards, and more." />
      </Helmet>

      {/* Main container with dynamic height */}
      <Box
        h={`${sectionHeight}vh`}
        bgImage="url('/static/dashboard/dashboard_image1.svg')"
        bgSize="cover"
        bgPosition="center"
        bgRepeat="no-repeat"
        w="100%"
        position="relative"
      >
        <Header />

        <Flex
          h="100%"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          p={{ base: "20px", md: "50px" }}
        >
          <Flex flexDirection="column" alignItems="center" textAlign="center" maxW={{ base: "90%", md: "60%" }} mb={{ base: "30px", md: "50px" }}>
            <Heading as="h1" fontSize={{ base: "24px", md: "48px" }} color="white.a700" mb="30px">
              Africa Rangeland Watch
            </Heading>
            <Text fontSize={{ base: "16px", md: "24px" }} lineHeight="1.5" color="white.a700" mb="32px" fontWeight="bold">
              Understand and monitor the impact of sustainable <br /> rangeland management in Africa.
            </Text>
          </Flex>

          {/* Buttons */}
          <Flex flexDirection={{ base: "column", md: "row" }} gap="20px" w="100%" maxW={{ base: "90%", md: "50%" }} mb="50px">
            <Button backgroundColor="dark_green.800" _hover={{ backgroundColor: "light_green.400" }} fontWeight={700} w="100%" color="white.a700" borderRadius="28px" onClick={() => navigate("/learn-more")}>
              Learn More
            </Button>
            <Button backgroundColor="dark_green.800" _hover={{ backgroundColor: "light_green.400" }} fontWeight={700} w="100%" color="white.a700" borderRadius="28px" onClick={() => navigate("/map")}>
              View Map
            </Button>
            {!isAuthenticated && (
              <Button backgroundColor="dark_orange.800" _hover={{ backgroundColor: "light_orange.400" }} fontWeight={700} w="100%" color="white.a700" borderRadius="28px" onClick={() => setIsSignInOpen(true)}>
                Sign In
              </Button>
            )}
          </Flex>

          {/* Drag Arrow */}
          <IconButton
            size="sm"
            icon={<Image src="/static/images/down_arrow.svg" />}
            aria-label="Resize Section"
            w="54px"
            borderRadius="6px"
            bg="transparent"
            position="absolute"
            bottom="-27px"
            cursor="ns-resize"
            onMouseDown={handleMouseDown}
          />
        </Flex>
      </Box>

      {/* Second Section (resizable) */}
      <Box bg="white" padding="20px" textAlign="center" display="flex" alignItems="center" justifyContent="center" h={`${100 - sectionHeight}vh`}>
        <Flex justify="center" align="center" height="200px">
          <Text fontSize="lg" fontWeight="bold" color="gray.500">
            No data available
          </Text>
        </Flex>
      </Box>

      <SignIn isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
      <Footer />
    </>
  );
}
