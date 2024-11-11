import Helmet from "react-helmet";
import Header from "../../components/Header";
import Sidebar1 from "../../components/SideBar";
import {
  Heading,
  Button,
  Flex,
  Input,
  Box,
  useBreakpointValue,
  Image
} from "@chakra-ui/react";
import React, { useState } from "react";
import RequestOrganisation from "../../components/RequestOrganisation";


export default function ProfileInformationPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [isRequestModalOpen, setRequestModalOpen] = useState(false);

  const openRequestModal = () => {
    setRequestModalOpen(true);
  };

  const closeRequestModal = () => {
    setRequestModalOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>Profile Information - Manage Your Account Details</title>
        <meta
          name="description"
          content="Update your basic information, manage your account settings, and set your preferences for using the platform. Ideal for researchers."
        />
      </Helmet>
      <Header />
      
      <Box bg="white" w="100%" p={{ base: "50px", md: "0px" }} >
        

        <Flex mr={{ md: "62px", base: "0px" }} gap="30px" alignItems="start" mt={{base: "-20%" ,md: "0%"}}>
        <Sidebar1 display={isSidebarOpen || !isMobile ? "flex" : "none"} />
          <Flex mt="24px" gap="14px" flex={1} flexDirection="column" alignItems="start">
            <Heading size="lg" as="h1" mb={6} color={{base: "black"}}>Basic Information</Heading>
            <Flex
              gap="30px"
              alignSelf="stretch"
              alignItems="start"
              flexDirection={{ md: "row", base: "column" }}
              w="100%"
            >
              {/* Left Column: Profile Picture */}
              <Box
                bg="gray.200"
                w={{ base: "100%", md: "220px" }}
                h={{ base: "200px", md: "220px" }}
                borderRadius="md"
                overflow="hidden"
                p="50px"
                mb={{ base: "20px", md: "0" }}
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <Image
                  src="static/images/profile_user_avatar.svg"
                  alt="User Profile Avatar"
                  w="80%"
                  h="80%"
                  objectFit="contain"
                />
              </Box>

              {/* Middle Column: Input Fields */}
              <Flex
                direction="column"
                flex={1}
                gap="20px"
                w="100%"
                alignSelf="stretch"
                paddingBottom="50px"
              >
                {/* Row 1: First Name and Last Name */}
                <Flex
                  gap="4"
                  flexDirection={{ base: "column", md: "row" }}
                  w="100%"
                  mb="4"
                >
                  <Flex flexDirection="column" flex={1}>
                    <Heading as="h6" size="xs" color="black" mb="2">
                      First Name
                    </Heading>
                    <Input
                      placeholder="Jackson"
                      borderRadius="5px"
                      borderWidth="1px"
                      borderColor="gray.500"
                    />
                  </Flex>
                  <Flex flexDirection="column" flex={1}>
                    <Heading as="h6" size="xs" color="black" mb="2">
                      Last Name
                    </Heading>
                    <Input
                      placeholder="Hendriks"
                      borderRadius="5px"
                      borderWidth="1px"
                      borderColor="gray.500"
                    />
                  </Flex>
                </Flex>

                {/* Row 2: Email Address and Password */}
                <Flex
                  gap="4"
                  flexDirection={{ base: "column", md: "row" }}
                  w="100%"
                  mb="8"
                >
                  <Flex flexDirection="column" flex={1} mb="4">
                    <Heading as="h6" size="xs" color="black" mb="2">
                      Email Address
                    </Heading>
                    <Input
                      placeholder="jackson@gmail.com"
                      borderRadius="5px"
                      borderWidth="1px"
                      borderColor="gray.500"
                    />
                  </Flex>
                  <Flex flexDirection="column" flex={1}>
                    <Heading as="h6" size="xs" color="black" mb="2">
                      Password
                    </Heading>
                    <Input
                      placeholder="******"
                      type="password"
                      borderRadius="5px"
                      borderWidth="1px"
                      borderColor="gray.500"
                    />
                  </Flex>
                </Flex>

                {/* Row 3: Purpose (Full Width) */}
                <Flex flexDirection="column" w="100%" mb="4">
                  <Heading as="h6" size="xs" color="black" mb="2">
                    Purpose
                  </Heading>
                  <Input
                    placeholder="What will you be using the platform for?"
                    borderRadius="5px"
                    borderWidth="1px"
                    borderColor="gray.500"
                  />
                </Flex>

                {/* Row 4: Organisation Name and Occupation */}
                <Flex
                  gap="4"
                  flexDirection={{ base: "column", md: "row" }}
                  w="100%"
                  mb="4"
                >
                  <Flex flexDirection="column" flex={1} mb="4">
                    <Heading as="h6" size="xs" color="black" mb="2">
                      Organisation Name
                    </Heading>
                    <Input
                      placeholder="Name of Organisation"
                      borderRadius="5px"
                      borderWidth="1px"
                      borderColor="gray.500"
                    />
                  </Flex>
                  <Flex flexDirection="column" flex={1}>
                    <Heading as="h6" size="xs" color="black" mb="2">
                      Occupation
                    </Heading>
                    <Input
                      placeholder="Researcher"
                      borderRadius="5px"
                      borderWidth="1px"
                      borderColor="gray.500"
                    />
                  </Flex>
                </Flex>

                {/* Row 5: Country */}
                <Flex flexDirection="column"  w= {{ base: "100%", md: "50%" }}>
                  <Heading as="h6" size="xs" color="black" mb="2">
                    Country
                  </Heading>
                  <Input
                    placeholder="South Africa"
                    borderRadius="5px"
                    borderWidth="1px"
                    borderColor="gray.500"
                  />
                </Flex>
              </Flex>

              {/* Right Column: Action Buttons */}
              <Flex
                flexDirection="column"
                alignItems="center"
                w={{ md: "18%", base: "100%" }}
                border="2px solid darkgreen"
                borderRadius="none"
                gap="0"
                mt={{ base: "4", md: "0" }}
              >
                <Button
                  size="sm"
                  fontWeight={700}
                  w="100%"
                  color="darkgreen"
                  borderBottom="2px solid darkgreen"
                  borderRadius={0}
                  p={4}
                >
                  Add Profile Image
                </Button>
                <Button
                  size="sm"
                  fontWeight={700}
                  w="100%"
                  color="darkgreen"
                  borderBottom="2px solid darkgreen"
                  borderRadius={0}
                  p={4}
                >
                  Change Associated Email
                </Button>
                <Button
                  size="sm"
                  fontWeight={700}
                  w="100%"
                  color="darkgreen"
                  borderBottom="2px solid darkgreen"
                  borderRadius={0}
                  p={4}
                >
                  Change Password
                </Button>
                <Button
                  size="sm"
                  fontWeight={700}
                  w="100%"
                  color="darkgreen"
                  borderRadius={0}
                  p={4}
                  onClick={openRequestModal}
                >
                  Request Organisation
                </Button>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
        {/* Add the RequestOrganisation modal */}
        <RequestOrganisation 
          isOpen={isRequestModalOpen} 
          onClose={closeRequestModal}
        />
      </Box>
    </>
  );
}
