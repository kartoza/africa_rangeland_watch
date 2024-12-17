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
  RadioGroup,
  Stack,
  Radio,
  Select,
  useToast
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { setCSRFToken } from "../../utils/csrfUtils";


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
  const modalRight = useBreakpointValue({ base: "5%", md: "25%" });
  const modalTransform = useBreakpointValue({
    base: "translate(-50%, -50%)",
    md: "none",
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [organisationEmail, setOrganisationEmail] = useState("");
  const [industry, setIndustry] = useState("");
  const [action, setAction] = useState("join");
  const [organisations, setOrganisations] = useState<{ id: string, name: string }[]>([]);
  const [selectedOrganisationId, setSelectedOrganisationId] = useState<string>("");
  const toast = useToast();

  useEffect(() => {
    if (action === "join") {
      axios
        .get("/api/fetch-organizations")
        .then((response) => setOrganisations(response.data))
        .catch((error) => console.error("Error fetching organisations:", error));
    }
  }, [action]);

  const handleSubmit = () => {
    setCSRFToken();
    const data =
      action === "join"
        ? { firstName, lastName, selectedOrganisationId }
        : { firstName, lastName, organisationName, organisationEmail, industry };

    axios
      .post(action === "join" ? "/api/join-organization/" : "/api/add-organization/", data)
      .then(() => {
        toast({
          title: "Request submitted",
          description: "Your request has been submitted successfully. Please be be patient whilst it is being reviewed.",
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top-right",
          containerStyle: {
            backgroundColor: "#00634b",
            color: "white",
          },
        });
        onClose();
      })
      .catch((error) => {
        console.error("Error submitting request:", error);
      });
  };

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
                <Text color="gray.800" fontSize="16px">
                  Please fill out the following request information for your organisation to join the platform.
                  Allow us some time to process your request, and we will get back to you as soon as possible!
                </Text>
              </Flex>

              <Flex mb="6px" flexDirection="column" alignItems="center">
                <Flex gap="20px" alignSelf="stretch" flexDirection="column">
                  <RadioGroup onChange={setAction} value={action}>
                    <Stack direction="row" spacing={4}>
                      <Radio value="join">Join Known Organisation</Radio>
                      <Radio value="add">Add New Organisation</Radio>
                    </Stack>
                  </RadioGroup>

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

                  {action === "join" ? (
                    <FormControl isRequired>
                      <FormLabel>Select Organisation</FormLabel>
                      <Select
                        placeholder="Select organisation"
                        value={selectedOrganisationId}
                        onChange={(e) => setSelectedOrganisationId(e.target.value)}
                      >
                        {organisations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <>
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

                      <Flex gap="20px" mb="8px">
                        <FormControl mb="8px">
                          <FormLabel htmlFor="organisationEmail" color="black" fontWeight={"bold"}>
                            Organisation Email
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
                          />
                        </FormControl>
                      </Flex>
                    </>
                  )}

                  <Flex justifyContent="flex-end" gap="20px">
                    <Button backgroundColor="darkorange" _hover={{ backgroundColor: "dark_orange.800" }} color="white" w="auto" borderRadius="5px" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      backgroundColor="dark_green.800"
                      _hover={{ backgroundColor: "light_green.400" }}
                      color="white"
                      w="auto"
                      borderRadius="5px"
                      disabled={
                        !firstName ||
                        !lastName ||
                        (action === "join" ? !selectedOrganisationId : !organisationName || !organisationEmail || !industry)
                      }
                      onClick={handleSubmit}
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
