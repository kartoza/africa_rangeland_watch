import {
    Modal,
    ModalContent,
    ModalOverlay,
    Button,
    Flex,
    Input,
    Heading,
    Text,
    Container,
    useBreakpointValue,
    ModalCloseButton,
    ModalBody,
    FormLabel,
    FormControl,
  } from "@chakra-ui/react";
  import React, { useState } from "react";
  
  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }
  
  type ModalPosition = "absolute" | "fixed";
  
  export default function RequestOrganisation({ isOpen, onClose }: Props) {
    const modalPosition = useBreakpointValue<ModalPosition>({
      base: "absolute",
      md: "fixed",
    });
    const modalTop = useBreakpointValue({ base: "20%", md: "7%" });
    const modalRight = useBreakpointValue({ base: "5%", md: "7%" });
    const modalTransform = useBreakpointValue({
      base: "translate(-50%, -50%)",
      md: "none",
    });
  
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [organisationName, setOrganisationName] = useState("");
    const [organisationEmail, setOrganisationEmail] = useState("");
    const [industry, setIndustry] = useState("");
  
    const label = useBreakpointValue({ base: "Email", md: "Organisation Email" });

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered={modalPosition === "absolute"}>
        <ModalOverlay />
        <ModalContent
          maxW={{ base: "90vw", md: "50vw" }}
          bg="white"
          position={modalPosition}
          top={modalTop}
          right={modalRight}
          transform={modalTransform}
          p={5}
        >
          <ModalCloseButton />
          <ModalBody p={0}> 
            <Flex flex={1} direction="column" p={4}>
              
                <Flex gap="12px" bg="whiteAlpha.700" w="100%" flexDirection="column" p="0" borderRadius="5px">
                  <Flex gap="14px" flexDirection="column" alignItems="start">
                    <Heading size="lg" color="gray.900" whiteSpace="nowrap">
                      Request Organisation
                    </Heading>
                    <Text color="gray.800" fontSize="16px" >
                      Please fill out the following request information for your organisation to join the platform.
                      Allow us some time to process your request, and we will get back to you as soon as possible!
                    </Text>
                  </Flex>
      
                  <Flex mb="6px" flexDirection="column" alignItems="center">
                    <Flex gap="20px" alignSelf="stretch" flexDirection="column">
                      {/* First Name and Last Name on same row */}
                      <Flex gap="20px" mb="8px">
                        <FormControl>
                          <FormLabel htmlFor="firstName" color="black" fontWeight={"bold"}>
                            First Name
                          </FormLabel>
                          <Input
                            id="firstName"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="gray.500"
                            flex="1"
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel htmlFor="lastName" color="black" fontWeight={"bold"}>
                            Last Name
                          </FormLabel>
                          <Input
                            id="lastName"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="gray.500"
                            flex="1"
                          />
                        </FormControl>
                      </Flex>
      
                      {/* Organisation Name */}
                      <FormControl mb="8px">
                        <FormLabel htmlFor="organisationName" color="black" fontWeight={"bold"}>
                          Organisation Name
                        </FormLabel>
                        <Input
                          id="organisationName"
                          placeholder="Organisation Name"
                          value={organisationName}
                          onChange={(e) => setOrganisationName(e.target.value)}
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor="gray.500"
                        />
                      </FormControl>
      
                      {/* Organisation Email and Industry on the same row */}
                      <Flex gap="20px" mb="8px">
                        <FormControl>
                        <FormLabel htmlFor="organisationEmail" color="black" fontWeight="bold">
                            {label}
                        </FormLabel>
                          <Input
                            id="organisationEmail"
                            placeholder="Organisation Email"
                            type="email"
                            value={organisationEmail}
                            onChange={(e) => setOrganisationEmail(e.target.value)}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="gray.500"
                            flex="1"
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel htmlFor="industry" color="black" fontWeight={"bold"}>
                            Industry
                          </FormLabel>
                          <Input
                            id="industry"
                            placeholder="Industry"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="gray.500"
                            flex="1"
                          />
                        </FormControl>
                      </Flex>
      
                      <Flex justifyContent="flex-end" gap="20px">
                        <Button
                          backgroundColor="darkorange"
                          _hover={{ backgroundColor: "dark_orange.800" }}
                          color="white"
                          w={{"base": "auto", md: "15%"}}
                          borderRadius="5px"
                          onClick={onClose}
                        >
                          Cancel
                        </Button>
                        <Button
                          backgroundColor="darkgreen"
                          _hover={{ backgroundColor: "dark_green.800" }}
                          color="white"
                          w={{"base": "auto", md: "25%"}}
                          borderRadius="5px"
                          disabled={
                            !firstName ||
                            !lastName ||
                            !organisationName ||
                            !organisationEmail ||
                            !industry
                          }
                        >
                          Request
                        </Button>
                      </Flex>
                    </Flex>
                  </Flex>
                </Flex>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
      
    );
  }
  
