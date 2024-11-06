import React from "react";
import {
    Heading,
    Text,
    Flex,
    Image,
    Link,
    Button,
    Checkbox,
    InputLeftElement,
    InputGroup,
    Center,
    InputRightElement,
    Input,
    Container,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalCloseButton,
    ModalBody,
    useBreakpointValue,
} from "@chakra-ui/react";

interface SignInProps {
    isOpen: boolean;
    onClose: () => void;
}

// Define allowed positions for modal positioning
type ModalPosition = "absolute" | "fixed";

export default function SignIn({ isOpen, onClose }: SignInProps) {
    const modalPosition = useBreakpointValue<ModalPosition>({ base: "absolute", md: "fixed" });
    const modalTop = useBreakpointValue({ base: "20%", md: "7%" });
    const modalRight = useBreakpointValue({ base: "5%", md: "7%" });
    const modalTransform = useBreakpointValue({ base: "translate(-50%, -50%)", md: "none" });

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered={modalPosition === "absolute"}>
            <ModalOverlay />
            <ModalContent
                maxW={{ base: "90vw", md: "25vw" }}
                bg="white"
                position={modalPosition}
                top={modalTop}
                right={modalRight}
                transform={modalTransform}
            >
                <ModalCloseButton />
                <ModalBody>
                    <Flex
                        h={{ md: "auto", base: "auto" }}
                        flex={1}
                        alignItems="left"
                        justifyContent="start"
                        px={{ base: "8px", md: "16px" }}
                        py={{ base: "8px", md: "16px" }}
                    >
                        <Container
                            mb="8px"
                            w="100%"
                            maxW="100%"
                            display="flex"
                            flexDirection="column"
                            alignItems="start"
                            px="0"
                        >
                            <Flex
                                gap="12px"
                                bg="whiteAlpha.700"
                                w="100%"
                                flexDirection="column"
                                p={{ base: "12px", md: "22px" }}
                                borderRadius="5px"
                                maxW="500px"
                            >
                                <Flex gap="14px" flexDirection="column" alignItems="start">
                                    <Heading size="lg" color="gray.900">
                                        Welcome Back!
                                    </Heading>
                                    <Text color="gray.800" fontSize="16px">
                                        Please sign into your profile.
                                    </Text>
                                </Flex>

                                <Flex mb="6px" flexDirection="column" alignItems="center">
                                    <Flex gap="20px" alignSelf="stretch" flexDirection="column">
                                        <InputGroup>
                                            <InputLeftElement>
                                                <Center w="16px" h="20px">
                                                    <Image src="images/email_icon.svg" alt="Email Icon" h="18px" w="16px" />
                                                </Center>
                                            </InputLeftElement>
                                            <Input placeholder="Email" type="email" color="gray.400" />
                                        </InputGroup>

                                        <InputGroup>
                                            <InputLeftElement>
                                                <Center w="16px" h="20px">
                                                    <Image src="images/lock_icon.svg" alt="Password Icon" h="18px" w="16px" />
                                                </Center>
                                            </InputLeftElement>
                                            <Input placeholder="Password" type="password" color="gray.400" />
                                            <InputRightElement>
                                                <Center w="20px" h="18px">
                                                    <Image src="images/eye_icon.svg" alt="Show Password Icon" h="18px" w="20px" />
                                                </Center>
                                            </InputRightElement>
                                        </InputGroup>

                                        <Flex mt="8px" justifyContent="space-between" alignItems="center" gap="20px">
                                            <Checkbox color="gray.900" fontSize="16px" fontWeight="700" gap="2px" py="4px">
                                                Remember me
                                            </Checkbox>
                                            <Link href="#" color="dark_orange.800">
                                                Forgot Password?
                                            </Link>
                                        </Flex>

                                        <Button
                                            backgroundColor="dark_green.800"
                                            _hover={{ backgroundColor: "light_green.400" }}
                                            fontWeight={700}
                                            w="100%"
                                            color="white.a700"
                                            borderRadius="2px"
                                        >
                                            Sign In
                                        </Button>
                                    </Flex>

                                    <Text color="gray.800" fontSize="16px" mt="14px">
                                        or continue with
                                    </Text>

                                    <Flex mt="22px" justifyContent="center" gap="20px">
                                        <Image src="images/google_icon.svg" alt="Google Icon" h="40px" w="40px" />
                                        <Image src="images/github_icon.svg" alt="GitHub Icon" h="40px" w="40px" />
                                        <Image src="images/apple_icon.svg" alt="Apple Icon" h="40px" w="40px" />
                                    </Flex>

                                    <Flex mt="28px" gap="12px" alignSelf="stretch" justifyContent="center">
                                        <Text color="gray.800" fontSize="16px">
                                            Don’t have an account?
                                        </Text>
                                        <Link href="#" color="dark_orange.800">
                                            Sign Up
                                        </Link>
                                    </Flex>
                                </Flex>
                            </Flex>
                        </Container>
                    </Flex>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
