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
  Image,
  Table,
  Tbody,
  Tr,
  Td,
  useToast,
  Tooltip,
  Text,
} from "@chakra-ui/react";
import React, { ChangeEvent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getUserProfile,
  updateProfile,
  updateProfileImage,
  updatePassword,
  resetUpdateSuccess
} from '../../store/userProfileSlice';
import { AppDispatch, RootState } from '../../store';
import RequestOrganisation from "../../components/RequestOrganisation";
import ChangePasswordModal from "../../components/ChangePassword";
import countries from "world-countries";
import Select from "react-select";


const countryOptions = countries.map((country) => ({
  value: country.cca2,
  label: country.name.common,
}));


export default function ProfileInformationPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [isRequestModalOpen, setRequestModalOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { profile, updateSuccess, loading, error } = useSelector((state: RootState) => state.userProfile);
  const toast = useToast();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);

  const [country, setCountry] = useState('');
  const [user_role, setUserRole] = useState('');
  const [purpose, setPurpose] = useState('');
  const [is_support_staff, setIsSupportStaff] = useState(false);
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [organisations, setOrganisations] = useState<string[]>([]);
  const [isEmailEditable, setIsEmailEditable] = useState(false);
  const [updatePicture, setUpdatePicture] = useState(false);

  const [isChanged, setIsChanged] = useState(false);

  const [image, setImage] = useState(null);

  const profileImage = profile?.profile_image || 'static/images/profile_user_avatar.svg';

  const toggleEmailEditable = () => {
    setIsEmailEditable(!isEmailEditable);
  };

  const handlePasswordChange = async (oldPassword: string, newPassword: string) => {
    console.log('Initiating password update');
    try {
      await dispatch(updatePassword({ oldPassword, newPassword })).unwrap();
      toast({
        title: "Password updated successfully",
        description: "Your password has been updated.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
        containerStyle: {
          backgroundColor: "#00634b",
          color: "white",
        },
      });
    } catch (error) {
      const errorMessage =
        error.detail || "An unexpected error occurred while updating the password.";
      toast({
        title: "Error updating password",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
        containerStyle: {
          backgroundColor: "red",
          color: "white",
        },
      });
      console.error('Error updating password:', error);
    }
  };
  

  useEffect(() => {
    if (profileImage) {
      setImage(profileImage);
    }
  }, [profileImage]);

  const openRequestModal = () => {
    setRequestModalOpen(true);
  };

  const closeRequestModal = () => {
    setRequestModalOpen(false);
  };

  useEffect(() => {
    dispatch(getUserProfile());
  }, [dispatch]);

  useEffect(() => {
    
    if(updateSuccess != false){
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
        containerStyle: {
          backgroundColor: "#00634b",
          color: "white",
        },
      });
      dispatch(resetUpdateSuccess());
    } else if (error != null &&  error !='Failed to fetch profile'){
      toast({
        title: "Error occurred",
        description: error,
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
  }, [updateSuccess]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name);
      setLastName(profile.last_name);
      setEmail(profile.email);
      setCountry(profile.country);
      setUserRole(profile.user_role);
      setIsSupportStaff(profile.is_support_staff);
      setOrganisations(profile.organisations);
    }
  }, [profile]);

  const handleUpdate = async () => {
    const updatedData = {
      first_name,
      last_name,
      email,
      country,
      user_role: user_role,
      is_support_staff: is_support_staff,
    };
    dispatch(updateProfile(updatedData));
    setIsChanged(false);
  };

  const handleInputChange = () => {
    setIsChanged(true);
  };

  const [selectedCountry, setSelectedCountry] = useState<{ value: string; label: string } | null>(null);

  useEffect(() => {
    if (country) {
      const foundCountry = countryOptions.find((c) => c.label === country);
      if (foundCountry) setSelectedCountry(foundCountry);
    }
  }, [country]);

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

      <Box bg="white" w="100%" p={{ base: "50px", md: "0px" }}>
        <Flex mr={{ md: "62px", base: "0px" }} gap="30px" alignItems="start" mt={{ base: "-20%", md: "0%" }}>
          <Sidebar1 display={isSidebarOpen || !isMobile ? "flex" : "none"} />
          <Flex mt="24px" gap="14px" flex={1} flexDirection="column" alignItems="start">
            <Heading size="lg" as="h1" mb={6} color={{ base: "black" }}>Basic Information</Heading>
            <Flex
              gap="30px"
              alignSelf="stretch"
              alignItems="start"
              flexDirection={{ md: "row", base: "column" }}
              w="100%"
            >
             
                {/* Left Column: Profile Picture and Upload Text */}
                <Flex flexDirection="column" alignItems="center">
                    <Box
                      bg="gray.200"
                      w={{ base: "100%", md: "220px" }}
                      h={{ base: "200px", md: "220px" }}
                      borderRadius="md"
                      overflow="hidden"
                      p="50px"
                      mb="10px" // Added margin to separate from text
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      cursor="pointer"
                    >
                      <label htmlFor="fileInput" style={{ width: "100%", height: "100%", cursor: "pointer" }}>
                        <Image
                          src={image}
                          alt="User Profile Avatar"
                          w="100%"
                          h="100%"
                          objectFit="cover"
                        />
                      </label>
                      <Input
                        id="fileInput"
                        type="file"
                        onChange={(e) => {
                          if (e.target.files) {
                            const file = e.target.files[0];
                            setImage(URL.createObjectURL(file));
                            setUpdatePicture(true);
                          } else {
                            setUpdatePicture(false);
                          }
                        }}
                        style={{ display: "none" }}
                      />
                    </Box>

                  {/* Message Below Avatar */}
                  <Box
                    bg="gray.100"
                    w={{ base: "100%", md: "220px" }}
                    p="2"
                    borderRadius="md"
                    textAlign="center"
                  >
                    <Text fontSize="sm" color="gray.600">
                      Click on avatar to choose profile picture
                    </Text>
                  </Box>
                </Flex>

              

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
                      value={first_name}
                      onChange={(e) => { setFirstName(e.target.value); handleInputChange(); }}
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
                      value={last_name}
                      onChange={(e) => { setLastName(e.target.value); handleInputChange(); }}
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
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); handleInputChange(); }}
                      isDisabled={!isEmailEditable}
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
                      isDisabled
                      type="password"
                      borderRadius="5px"
                      borderWidth="1px"
                      borderColor="gray.500"
                    />
                  </Flex>
                </Flex>

                {/* Row 3: Purpose */}
                <Flex flexDirection="column" w="100%" mb="4">
                  <Heading as="h6" size="xs" color="black" mb="2">
                    Purpose
                  </Heading>
                  <Input
                    placeholder="What will you be using the platform for?"
                    onChange={(e) => { setPurpose(e.target.value); handleInputChange(); }}
                    borderRadius="5px"
                    borderWidth="1px"
                    borderColor="gray.500"
                  />
                </Flex>

                {/* Row 4: Organisation and Occupation */}
                <Flex
                  gap="4"
                  flexDirection={{ base: "column", md: "row" }}
                  w="100%"
                  mb="4"
                >
                  <Flex flexDirection="column" flex={1}>
                    <Heading as="h6" size="xs" mb="2" color="black">Organisations</Heading>
                    <Box p="2">
                      {Array.isArray(organisations) && organisations.length > 0 ? (
                        <Table variant="striped" colorScheme="gray" size="sm" width="100%">
                          <Tbody>
                            {organisations.map((org, index) => (
                              <Tr key={index}>
                                <Td>{org}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      ) : (
                        <Text fontSize="sm" color="gray.600">
                          None
                        </Text>
                      )}
                    </Box>
                  </Flex>
                  <Flex flexDirection="column" flex={1}>
                    <Heading as="h6" size="xs" color="black" mb="2">
                      Occupation
                    </Heading>
                    <Input
                      value={user_role}
                      isDisabled
                      placeholder="Researcher"
                      borderRadius="5px"
                      borderWidth="1px"
                      borderColor="gray.500"
                    />
                  </Flex>
                </Flex>

                {/* Row 5: Country */}
                <Flex flexDirection="column" w={{ base: "100%", md: "50%" }}>
                  <Heading as="h6" size="xs" color="black" mb="2">
                    Country
                  </Heading>
                  <Select
                    options={countryOptions}
                    value={selectedCountry}
                    onChange={(selectedOption) => {
                      setSelectedCountry(selectedOption); 
                      setCountry(selectedOption?.label);
                      handleInputChange();
                    }}
                    placeholder="Select a country..."
                    isSearchable
                  />
                </Flex>
              </Flex>

              {/* Right Column: Action Buttons */}

              <Tooltip label="Click an action to perform" hasArrow placement="top">
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
                    color={`${updatePicture ? 'white' : 'darkgreen'}`}
                    borderBottom="2px solid darkgreen"
                    borderRadius={0}
                    backgroundColor={`${updatePicture ? 'darkgreen' : 'transparent'}`}
                    p={4}
                    onClick={() => {
                      const fileInput = document.getElementById("fileInput") as HTMLInputElement;
                      if (fileInput?.files?.[0]) {
                        const formData = new FormData();
                        formData.append("profile_image", fileInput.files[0]);

                        dispatch(updateProfileImage(formData))
                          .then(() => {
                            toast({
                              title: "Profile image updated.",
                              description: "Your profile image has been updated successfully.",
                              status: "success",
                              duration: 5000,
                              isClosable: true,
                              position: "top-right",
                              containerStyle: {
                                backgroundColor: "#00634b",
                                color: "white",
                              },
                            });
                          })
                          .catch(() => {
                            toast({
                              title: "Error updating image.",
                              description: "There was an error updating your profile image.",
                              status: "error",
                              duration: 5000,
                              isClosable: true,
                              position: "top-right",
                              containerStyle: {
                                backgroundColor: "red",
                                color: "white",
                              },
                            });
                          });
                      } else {
                        toast({
                          title: "No image selected.",
                          description: "Please choose an image to upload.",
                          status: "warning",
                          duration: 5000,
                          isClosable: true,
                          position: "top-right",
                        });
                      }

                    }}
                  >
                    Update Profile Image
                  </Button>
                  <Button
                    size="sm"
                    fontWeight={700}
                    w="100%"
                    color="darkgreen"
                    borderBottom="2px solid darkgreen"
                    borderRadius={0}
                    p={4}
                    onClick={toggleEmailEditable}
                  >
                    Change Associated Email
                  </Button>
                  <Button
                    size="sm"
                    fontWeight={700}
                    w="100%"
                    color={`${isPasswordModalOpen ? 'white' : 'darkgreen'}`}
                    borderBottom="2px solid darkgreen"
                    borderRadius={0}
                    backgroundColor={`${isPasswordModalOpen ? 'darkgreen' : 'transparent'}`}
                    p={4}
                    onClick={() => setIsPasswordModalOpen(true)}
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
                  {isChanged && (
                    <Button
                      size="sm"
                      fontWeight={700}
                      w="100%"
                      color={`${isChanged ? 'white' : 'darkgreen'}`}
                      borderBottom="2px solid darkgreen"
                      borderRadius={0}
                      backgroundColor={`${isChanged ? 'darkgreen' : 'transparent'}`}
                      p={4}
                      onClick={handleUpdate}
                    >
                      Update Info
                    </Button>
                  )}
                </Flex>
              </Tooltip>
            </Flex>
          </Flex>
        </Flex>

        {/* Request Organization Modal */}
        <RequestOrganisation
          isOpen={isRequestModalOpen}
          onClose={closeRequestModal}
        />

        {/* change password */}
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          onSubmit={handlePasswordChange}
        />
      </Box>
    </>
  );
}
