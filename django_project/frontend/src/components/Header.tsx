import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Flex, Box, Text, Image, UnorderedList, ListItem, Link, IconButton, useDisclosure } from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import MegaMenu from './MegaMenu';
import SignIn from './SignIn';
import { AppDispatch, RootState } from '../store';
import { checkLoginStatus, logoutUser } from '../store/authSlice';

export default function Header(props: any) {
    const dispatch = useDispatch<AppDispatch>(); 
    const { user, token } = useSelector((state: RootState) => state.auth);
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuOpenAlt, setMenuOpenAlt] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSignInOpen, setIsSignInOpen] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const location = useLocation();
    const navigate = useNavigate();

    // Handle avatar click
    const handleAvatarClick = () => {
        if (token) {
            // Show popup with links to profile and other pages
            onOpen();
        } else {
            // Trigger sign-in modal
            setIsSignInOpen(true);
        }
    };

    
    useEffect(() => {
        dispatch(checkLoginStatus());
    }, [dispatch]);

    const handleLogout = () => {
        dispatch(logoutUser());
        onClose();
        navigate('/');
    };
    
    const isDashboard = location.pathname === '/dashboard';
    const isProfile = location.pathname === '/profile';

    return (
        <>
            {/* Header Section */}
            <Flex
                {...props}
                bg="dark_green.800"
                justifyContent="space-between"
                alignItems="center"
                px="16px"
                py="4px"
                as="header"
                w="100%"
                position="relative"
            >
                {/* Logo on the Left */}
                <Flex alignItems="center">
                    <Image
                        src="static/images/main_logo.svg"
                        alt="Header Logo"
                        h="52px"
                        w="auto"
                        maxW="190px"
                        zIndex={100}
                    />
                </Flex>

                {/* Centered Menu Items (Desktop only) */}
                <UnorderedList
                    styleType="none"
                    gap="44px"
                    display={{ base: "none", sm: "flex" }}
                    flexDirection="row"
                    alignItems="center"
                    zIndex={10}
                >
                    <ListItem>
                        <Link href="/#/map" _hover={{ textDecoration: 'underline', textDecorationColor: 'white' }}>
                            <Text color="white">MAP</Text>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Link
                            href="/dashboard" // Link to the dashboard
                            _hover={{ textDecoration: 'underline', textDecorationColor: 'white' }}
                            _focus={{ textDecoration: 'underline', textDecorationColor: 'white' }}
                            style={{ textDecoration: isDashboard ? 'underline' : 'none', textDecorationColor: 'white' }}
                        >
                            <Text color="white">DASHBOARD</Text>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Link href="#" _hover={{ textDecoration: 'underline', textDecorationColor: 'white' }}>
                            <Text color="white">HELP</Text>
                        </Link>
                    </ListItem>
                    <ListItem
                        onMouseEnter={() => setMenuOpen(true)}
                        onMouseLeave={() => setMenuOpen(false)}
                    >
                        <Flex gap="4px" alignItems="center" cursor="pointer">
                            <Text color="white">ABOUT</Text>
                            <Image src="static/images/arrow_down.svg" alt="Dropdown Arrow" h="8px" w="16px" />
                        </Flex>
                        {menuOpen && <MegaMenu />}
                    </ListItem>
                    <ListItem
                        onMouseEnter={() => setMenuOpenAlt(true)}
                        onMouseLeave={() => setMenuOpenAlt(false)}
                    >
                        <Flex gap="4px" alignItems="center" cursor="pointer">
                            <Text color="white">RESOURCES</Text>
                            <Image src="static/images/arrow_down.svg" alt="Dropdown Arrow" h="8px" w="16px" />
                        </Flex>
                        {menuOpenAlt && <MegaMenu />}
                    </ListItem>
                </UnorderedList>

                {/* Right-aligned Icons (Desktop) and Hamburger (Mobile) */}
                <Flex alignItems="center">
                    <IconButton
                        display={{ base: "flex", sm: "none" }}
                        icon={isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
                        aria-label="Toggle Menu"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        bg="transparent"
                        color="white"
                    />

                    {/* Desktop Icons */}
                    <Flex display={{ base: "none", sm: "flex" }} gap="20px">
                        {/* Show search and notification icons only if logged in */}
                        {token && (
                            <>
                                <Link href="#"><Image src="static/images/search_icon.svg" alt="search" h="24px" /></Link>
                                <Link href="#"><Image src="static/images/notifications_icon.svg" alt="Notif" h="24px" w="24px" /></Link>
                            </>
                        )}

                        {/* User Avatar - Conditionally rendered based on login status */}
                        {token ? (
                            <Link onClick={handleAvatarClick}>
                                {/* Show logged-in user avatar */}
                                <Image src={"static/images/logged_in_user_avatar.svg"} alt="user" h="28px" />
                            </Link>
                        ) : (
                            <Link onClick={() => setIsSignInOpen(true)}>
                                {/* Default avatar for non-logged-in users */}
                                <Image src="static/images/user_avatar_header_icon.svg" alt="user" h="24px" />
                            </Link>
                        )}
                    </Flex>
                </Flex>
            </Flex>

            {/* Dropdown Menu for Mobile */}
            {isMobileMenuOpen && (
                <Box
                    bg="dark_green.800"
                    w="80%"
                    borderRadius={'5px'}
                    py="16px"
                    display={{ base: "block", sm: "none" }}
                    position="absolute"
                    top="5%"
                    left="10%"
                    zIndex="10"
                >
                    <UnorderedList
                        styleType="none"
                        flexDirection="column"
                        alignItems="center"
                        textAlign="center"
                        gap="20px"
                        display="flex"
                        color="white"
                    >
                        <ListItem><Link href="/#/map"><Text>MAP</Text></Link></ListItem>
                        <ListItem><Link href="/dashboard"><Text>DASHBOARD</Text></Link></ListItem>
                        <ListItem><Link href="#"><Text>HELP</Text></Link></ListItem>
                        <ListItem onMouseEnter={() => setMenuOpen(true)} onMouseLeave={() => setMenuOpen(false)}>
                            <Flex gap="4px" alignItems="center" cursor="pointer">
                                <Text>ABOUT</Text>
                                <Image src="static/images/arrow_down.svg" alt="Dropdown Arrow" h="8px" w="16px" />
                            </Flex>
                            {menuOpen && <MegaMenu />}
                        </ListItem>
                        <ListItem onMouseEnter={() => setMenuOpenAlt(true)} onMouseLeave={() => setMenuOpenAlt(false)}>
                            <Flex gap="4px" alignItems="center" cursor="pointer">
                                <Text>RESOURCES</Text>
                                <Image src="static/images/arrow_down.svg" alt="Dropdown Arrow" h="8px" w="16px" />
                            </Flex>
                            {menuOpenAlt && <MegaMenu />}
                        </ListItem>
                    </UnorderedList>
                </Box>
            )}

            {/* Sign-In Modal */}
            <SignIn isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />

            {/* Avatar Popup / Menu for logged-in users */}
            {token && isOpen && (
                <Flex
                    direction="column"
                    bg="white"
                    p="20px"
                    position="absolute"
                    right="16px"
                    top="60px"
                    zIndex={999}
                    borderRadius="8px"
                    boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
                >
                    <Link href="#/profile" mb="4px">Profile</Link>
                    <Link href="#/dashboard" mb="4px">Dashboard</Link>
                    <Link onClick={handleLogout}>Logout</Link>
                </Flex>
            )}
        </>
    );
}
