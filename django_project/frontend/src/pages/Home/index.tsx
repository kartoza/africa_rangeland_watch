import { Helmet } from "react-helmet";
import Header from "../../components/Header";
import  Footer  from "../../components/Footer";
import SignIn from "../../components/SignIn";
import { IconButton, Image, Button, Flex, Text, Heading, Box, useToast } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsLoggedIn } from "../../store/authSlice";

export default function HomePage() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate()
  const isAuthenticated = useSelector(selectIsLoggedIn);

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
      
      {/* Main container with background image */}
      <Box
        h={{ md: "60vh", base: "70vh" }}
        bgImage="url('/static/dashboard/dashboard_image1.svg')"
        bgSize="cover"
        bgPosition="center"
        bgRepeat="no-repeat"
        w="100%"
        position="relative"
      >
        {/* Header */}
        <Header />

        {/* Content overlaying the background image */}
        <Flex
          h="100%"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          p={{ base: "20px", md: "50px" }}
        >
          {/* Title and Description */}
          <Flex
            flexDirection="column"
            alignItems="center"
            textAlign="center"
            maxW={{ base: "90%", md: "60%" }}
            mb={{ base: "30px", md: "50px" }}
          >
            <Heading as="h1" fontSize={{ base: "24px", md: "48px" }} color="white.a700" mb="30px">
              Africa Rangeland Watch
            </Heading>
            <Text
              fontSize={{ base: "16px", md: "24px" }}
              lineHeight="1.5"
              color="white.a700"
              mb="32px"
              fontWeight="bold"
            >
              Understand and monitor the impact of sustainable <br /> rangeland management in Africa.
            </Text>
          </Flex>


          {/* Buttons */}
          <Flex
            flexDirection={{ base: "column", md: "row" }}
            gap="20px"
            w="100%"
            maxW={{ base: "90%", md: "50%" }}
            mb="50px" // Spacing between buttons and IconButton
          >
            <Button
              backgroundColor="dark_green.800"
              _hover={{ backgroundColor: "light_green.400" }}
              fontWeight={700}
              w="100%"
              color="white.a700"
              borderRadius="28px"
              onClick={() => {navigate("/learn-more")}}
            >
              Learn More
            </Button>
            <Button
              backgroundColor="dark_green.800"
              _hover={{ backgroundColor: "light_green.400" }}
              fontWeight={700}
              w="100%"
              color="white.a700"
              borderRadius="28px"
              onClick={() => {navigate("/map")}}
            >
              View Map
            </Button>
            {!isAuthenticated && 
              <Button
                backgroundColor="dark_orange.800"
                _hover={{ backgroundColor: "light_orange.400" }}
                  fontWeight={700}
                  w="100%"
                  color="white.a700"
                  borderRadius="28px"
                  onClick={() => setIsSignInOpen(true)}
              >
                Sign In
              </Button>
            }
          </Flex>

          {/* Scroll Down Icon */}
          <IconButton
            size="sm"
            icon={<Image src="/static/images/down_arrow.svg" />}
            aria-label="Scroll Down Icon"
            w="54px"
            borderRadius="6px"
            bg="transparent"
            position="absolute"
            bottom="-27px" // Positions the icon halfway outside the box
          />

         
        </Flex>
      </Box>
      <Box 
          bg="white" 
          padding="20px" 
          textAlign="center" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          h={{ md: "35vh", base: "50vh" }}
        >
          <Text fontSize="20px" fontWeight="bold" color="gray.800">Information here.</Text>
        </Box>
      {/* Sign-In Modal */}
      <SignIn isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />

      {/* Footer */}
      <Footer />
    </>
  );
}
