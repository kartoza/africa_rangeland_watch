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
import { useDispatch, useSelector } from "react-redux";
import { loginUser, registerUser, resetPasswordRequest, resetPasswordConfirm } from "../store/authSlice";
import { RootState, AppDispatch } from "../store";
import { useLocation } from "react-router-dom";
import SessionPrompt from "./SessionPrompt";

interface SignInProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalPosition = "absolute" | "fixed";

export default function SignIn({ isOpen, onClose }: SignInProps) {
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

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [formType, setFormType] = useState<"signin" | "forgotPassword" | "signup" | "resetPassword">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [resetError, setResetError] = useState("");
  const [canSubmit, setCanSubmit] = useState(true);

  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, token } = useSelector((state: RootState) => state.auth);

  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const uid = searchParams.get("uid");
  const tokenFromUrl = searchParams.get("token");

  const [isOpenReset, setIsOpen] = useState(false);

  useEffect(() => {
    if (uid && tokenFromUrl) {
      setFormType("resetPassword");
    }
  }, [uid]);

  useEffect(() => {
    setStatusMessage(null);
    setResetError(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    formType === "resetPassword" ? setIsOpen(true):setIsOpen(false);
    setCanSubmit(true);
  }, [formType]);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendResetLink = async () => {
    setStatusMessage(null)
    await dispatch(resetPasswordRequest(email));
    if(error ==  null)
      setStatusMessage("Reset link sent to your email.");
  };

  const handleSignUp = () => {
    if (password !== confirmPassword) {
      setResetError("Passwords do not match!");
      return;
    }
    setStatusMessage(null);
    setResetError(null);
    dispatch(registerUser(email, password, confirmPassword));
  };

  const handleSignIn = () => {
    dispatch(loginUser(email, password, rememberMe));
  };

  const closeModal = () => {
    setIsOpen(false)
  }

  const handleResetPassword = () => {
    if (password !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    if (uid && tokenFromUrl) {
      dispatch(resetPasswordConfirm(uid,tokenFromUrl,password));
    } else {
      setResetError("Invalid reset link.");
    }
    setCanSubmit(true)
  };

  useEffect(() => {
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRememberMe(false);
      if(token)
        onClose()
      setIsOpen(false)
  }, [token, onClose]);

  useEffect(() => {
    if (error) {
      setResetError(error);
      setStatusMessage(null)
    } else
    if (statusMessage) {
      setResetError(null);
    }
  }, [error, statusMessage]); 

  return (
    <>
    <Modal isOpen={isOpen || isOpenReset} onClose={onClose} isCentered={modalPosition === "absolute"}>
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
                      : formType === "resetPassword"
                      ? "Reset Password"
                      : "Sign Up"}
                  </Heading>
                  <Text color="gray.800" fontSize="16px">
                    {formType === "signin"
                      ? "Please sign into your profile."
                      : formType === "forgotPassword"
                      ? "Enter your email to receive a reset link."
                      : formType === "resetPassword"
                      ? "Please set your new password."
                      : "Create a new account."}
                  </Text>
                </Flex>

                {statusMessage && <Text color="green.500">{statusMessage}</Text>}
                {resetError && (
                  <Text color={resetError === "Verification email sent." ? "green.500" : resetError === "Password has been successfully reset."? "green.500": "red.500"}>
                    {resetError}
                  </Text>
                )}


                <Flex mb="6px" flexDirection="column" alignItems="center">
                  <Flex gap="20px" alignSelf="stretch" flexDirection="column">
                    {(formType === "signin" || formType === "signup" || formType === "forgotPassword") && (
                      <InputGroup>
                        <InputLeftElement>
                          <Center w="16px" h="20px">
                            <Image src="static/images/email_icon.svg" alt="Email Icon" h="18px" w="16px" />
                          </Center>
                        </InputLeftElement>
                        <Input
                          placeholder="Email"
                          type="email"
                          color="gray.800"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor="gray.500"
                        />
                      </InputGroup>
                    )}

                    {(formType === "signin" || formType === "signup" || formType === "resetPassword") && (
                      <InputGroup>
                        <InputLeftElement>
                          <Center w="16px" h="20px">
                            <Image src="static/images/lock_icon.svg" alt="Password Icon" h="18px" w="16px" />
                          </Center>
                        </InputLeftElement>
                        <Input
                          placeholder="Password"
                          type={isPasswordVisible ? "text" : "password"}
                          color="gray.800"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor="gray.500"
                        />
                        <InputRightElement onClick={togglePasswordVisibility} cursor="pointer">
                          <Center w="20px" h="18px">
                            <Image
                              src={isPasswordVisible ? "static/images/eye_icon_unchecked.svg" : "static/images/eye_icon.svg"}
                              alt="Toggle Password Visibility"
                              h="18px"
                              w="20px"
                            />
                          </Center>
                        </InputRightElement>
                      </InputGroup>
                    )}

                    {(formType === "signup" || formType === "resetPassword") && (
                      <InputGroup>
                        <InputLeftElement>
                          <Center w="16px" h="20px">
                            <Image src="static/images/lock_icon.svg" alt="Password Icon" h="18px" w="16px" />
                          </Center>
                        </InputLeftElement>
                        <Input
                          placeholder="Confirm Password"
                          type="password"
                          color="gray.800"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor="gray.500"
                        />
                      </InputGroup>
                    )}

                    

                    {formType === "signin" && (
                      <Flex mt="8px" justifyContent="space-between" alignItems="center" gap="20px">
                        <Checkbox
                          color="gray.900"
                          fontSize="18px"
                          fontWeight="700"
                          gap="2px"
                          py="4px"
                          size={"lg"}
                          checked={rememberMe}
                          onChange={() => setRememberMe(!rememberMe)}
                        >
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
                          ? handleSignIn
                          : formType === "forgotPassword"
                          ? handleSendResetLink
                          : formType === "resetPassword"
                          ? handleResetPassword
                          : handleSignUp
                      }
                      disabled={
                        formType === "signin" || formType === "signup"
                          ? !isValidEmail(email) || loading
                          : formType === "resetPassword"
                          ? !canSubmit
                          : formType === "forgotPassword"
                          ? !canSubmit : canSubmit || loading
                      }
                    >
                      {formType === "signin"
                        ? "Sign In"
                        : formType === "forgotPassword"
                        ? "Send Email"
                        : formType === "resetPassword"
                        ? "Reset Password"
                        : "Sign Up"}
                    </Button>

                  </Flex>
                </Flex>

                {/* Social login options */}
                {(formType === "signin" || formType === "signup") && (
                  <>
                   <Flex mt="22px" justifyContent="center" gap="20px">
                      <Text color="gray.800" fontSize="16px" mt="14px">
                        or continue with
                      </Text>
                   </Flex>
                    
                      <Flex mt="22px" justifyContent="center" gap="20px">
                      <a href="/accounts/google/login/">
                        <Image
                          src="static/images/google_icon.svg"
                          alt="Google Icon"
                          h="40px"
                          w="40px"
                        />
                      </a>
                      <a href="/accounts/github/login/">
                        <Image
                          src="static/images/github_icon.svg"
                          alt="GitHub Icon"
                          h="40px"
                          w="40px"
                        />
                      </a>
                      <Image src="static/images/apple_icon.svg" alt="Apple Icon" h="40px" w="40px" />
                    </Flex>
                  </>
                )}

                {/* Switch between Sign In and Sign Up */}
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
            </Container>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
    <SessionPrompt />
    </>
  );
}
