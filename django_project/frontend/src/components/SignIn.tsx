import React, { useEffect, useState } from "react";
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

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [formType, setFormType] = useState<"signin" | "forgotPassword" | "signup">("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [statusMessage, setStatusMessage] = useState("");

    // Toggle password visibility and icon
    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    useEffect(() => {
        setStatusMessage("");
    }, [formType]);

    // Validate email format
    const isValidEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleSendResetLink = () => {
        setStatusMessage("Reset link sent to your email.");
    };

    const handleSignUp = () => {
        setStatusMessage("Verification email sent.");
    };

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
                    <Flex h="auto" flex={1} alignItems="left" justifyContent="start" p="0px">
                        <Container mb="8px" w="100%" maxW="100%" display="flex" flexDirection="column" alignItems="start" px="0">
                            <Flex gap="12px" bg="whiteAlpha.700" w="100%" flexDirection="column" p="22px" borderRadius="5px" maxW="600px">
                                <Flex gap="14px" flexDirection="column" alignItems="start">
                                    <Heading size="lg" color="gray.900">
                                        {formType === "signin"
                                            ? "Welcome Back!"
                                            : formType === "forgotPassword"
                                            ? "Forgot Password"
                                            : "Sign Up"}
                                    </Heading>
                                    <Text color="gray.800" fontSize="16px">
                                        {formType === "signin"
                                            ? "Please sign into your profile."
                                            : formType === "forgotPassword"
                                            ? "Enter your email to receive a reset link."
                                            : "Create a new account."}
                                    </Text>
                                </Flex>

                                {statusMessage && <Text color="green.500">{statusMessage}</Text>}

                                <Flex mb="6px" flexDirection="column" alignItems="center">
                                    <Flex gap="20px" alignSelf="stretch" flexDirection="column">
                                        {(formType === "signin" || formType === "signup" || formType === "forgotPassword") && (
                                            <InputGroup>
                                                <InputLeftElement>
                                                    <Center w="16px" h="20px">
                                                        <Image src="images/email_icon.svg" alt="Email Icon" h="18px" w="16px" />
                                                    </Center>
                                                </InputLeftElement>
                                                <Input
                                                    placeholder="Email"
                                                    type="email"
                                                    color="gray.800"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    borderRadius="md"
                                                    borderWidth="1px" borderColor="gray.500"
                                                />
                                            </InputGroup>
                                        )}

                                        {(formType === "signin" || formType === "signup") && (
                                            <InputGroup>
                                                <InputLeftElement>
                                                    <Center w="16px" h="20px">
                                                        <Image src="images/lock_icon.svg" alt="Password Icon" h="18px" w="16px" />
                                                    </Center>
                                                </InputLeftElement>
                                                <Input
                                                    placeholder="Password"
                                                    type={isPasswordVisible ? "text" : "password"}
                                                    color="gray.800"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    borderRadius="md"
                                                    borderWidth="1px" borderColor="gray.500"
                                                />
                                                <InputRightElement onClick={togglePasswordVisibility} cursor="pointer">
                                                    <Center w="20px" h="18px">
                                                        <Image
                                                            src={isPasswordVisible ? "images/eye_icon_unchecked.svg" : "images/eye_icon.svg"}
                                                            alt="Toggle Password Visibility"
                                                            h="18px"
                                                            w="20px"
                                                        />
                                                    </Center>
                                                </InputRightElement>
                                            </InputGroup>
                                        )}

                                        {formType === "signup" && (
                                            <InputGroup>
                                                <InputLeftElement>
                                                    <Center w="16px" h="20px">
                                                        <Image src="images/lock_icon.svg" alt="Password Icon" h="18px" w="16px" />
                                                    </Center>
                                                </InputLeftElement>
                                                <Input
                                                    placeholder="Confirm Password"
                                                    type="password"
                                                    color="gray.800"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    borderRadius="md"
                                                    borderWidth="1px" borderColor="gray.500"
                                                />
                                            </InputGroup>
                                        )}

                                        {formType === "signin" && (
                                            <Flex mt="8px" justifyContent="space-between" alignItems="center" gap="20px">
                                                <Checkbox color="gray.900" fontSize="18px" fontWeight="700" gap="2px" py="4px" size={"lg"}>
                                                    Remember me
                                                </Checkbox>
                                                <Link color="dark_orange.800" onClick={() => setFormType("forgotPassword")}>
                                                    Forgot Password?
                                                </Link>
                                            </Flex>
                                        )}

                                        <Button
                                            backgroundColor="dark_green.800"
                                            _hover={{ backgroundColor: "light_green.400" }}
                                            fontWeight={700}
                                            w="100%"
                                            color="white.a700"
                                            borderRadius="2px"
                                            onClick={
                                                formType === "signin"
                                                    ? () => {} // Handle sign-in
                                                    : formType === "forgotPassword"
                                                    ? handleSendResetLink
                                                    : handleSignUp
                                            }
                                            disabled={!isValidEmail(email)}
                                        >
                                            {formType === "signin"
                                                ? "Sign In"
                                                : formType === "forgotPassword"
                                                ? "Send Email"
                                                : "Sign Up"}
                                        </Button>
                                    </Flex>

                                    {(formType === "signin" || formType === "signup") && (
                                        <>
                                            <Text color="gray.800" fontSize="16px" mt="14px">
                                                or continue with
                                            </Text>
                                            <Flex mt="22px" justifyContent="center" gap="20px">
                                                <Image src="images/google_icon.svg" alt="Google Icon" h="40px" w="40px" />
                                                <Image src="images/github_icon.svg" alt="GitHub Icon" h="40px" w="40px" />
                                                <Image src="images/apple_icon.svg" alt="Apple Icon" h="40px" w="40px" />
                                            </Flex>
                                        </>
                                    )}

                                    {formType !== "signin" && (
                                        <Flex mt="28px" gap="12px" alignSelf="stretch" justifyContent="center">
                                            <Link color="dark_orange.800" onClick={() => setFormType("signin")}>
                                                Back to Sign In
                                            </Link>
                                        </Flex>
                                    )}

                                    {formType === "signin" && (
                                        <Flex mt="28px" gap="12px" alignSelf="stretch" justifyContent="center">
                                            <Text color="gray.800" fontSize="16px">
                                                Don’t have an account?
                                            </Text>
                                            <Link color="dark_orange.800" onClick={() => setFormType("signup")}>
                                                Sign Up
                                            </Link>
                                        </Flex>
                                    )}
                                </Flex>
                            </Flex>
                        </Container>
                    </Flex>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
