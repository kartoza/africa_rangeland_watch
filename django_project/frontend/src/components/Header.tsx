import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Flex, Box, Text, Image, UnorderedList, ListItem, Link, IconButton, useDisclosure } from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import MegaMenu from './MegaMenu';
import SignIn from './SignIn';
import { AppDispatch, RootState } from '../store';
import { checkLoginStatus } from '../store/authSlice';
import { selectIsLoggedIn } from "../store/authSlice";
import { useSession } from '../sessionProvider'

export default function Header(props: any) {
    const dispatch = useDispatch<AppDispatch>();
    const { user, token } = useSelector((state: RootState) => state.auth);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const location = useLocation();
    const navigate = useNavigate();
    const isAuthenticated = useSelector(selectIsLoggedIn);
    const { saveSession } = useSession();

    useEffect(() => {
        if (isAuthenticated && location.pathname !== '/' && location.pathname !== '/map') {
            saveSession(location.pathname, { activity: "Visited Page" });
        }
    }, [isAuthenticated, location.pathname, saveSession]);

    
    // Handle hover for different sections
    const handleHoverEnter = (section: string) => {
        setHoveredSection(section);
    };

    const handleHoverLeave = () => {
        setHoveredSection(null);
    };

    useEffect(() => {
        dispatch(checkLoginStatus());
    }, [dispatch]);

    const isSelected = (menuName: string) => {
        return location.pathname.includes(menuName)
    }

    const handleNavigation = (to: string | undefined) => {
        if (to) {
          navigate(to);
        }
      };

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
                zIndex={100}
            >
                {/* Logo on the Left */}
                <Flex alignItems="center">
                    <a href={'/'}>
                        <Image
                            src="static/images/main_logo.svg"
                            alt="Header Logo"
                            h="52px"
                            w="auto"
                            maxW="190px"
                        />
                    </a>
                </Flex>

                {/* Centered Menu Items (Desktop only) */}
                <UnorderedList
                    styleType="none"
                    gap="65px"
                    display={{ base: "none", sm: "flex" }}
                    flexDirection="row"
                    alignItems="center"
                    zIndex={10}
                >
                    <ListItem>
                        <Link href="/#/map"
                              _hover={{ textDecoration: 'underline', textDecorationColor: 'white' }}
                              style={{ textDecoration: isSelected('map') ? 'underline' : 'none', textDecorationColor: 'white' }}
                        >
                            <Text color="white" fontWeight={400} fontSize={16}>MAP</Text>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Link
                            onClick={() => handleNavigation('/dashboard')}
                            _hover={{ textDecoration: 'underline', textDecorationColor: 'white' }}
                            _focus={{ textDecoration: 'underline', textDecorationColor: 'white' }}
                            style={{ textDecoration: isSelected('dashboard') ? 'underline' : 'none', textDecorationColor: 'white' }}
                        >
                            <Text color="white" fontWeight={400} fontSize={16}>DASHBOARD</Text>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Link href="https://www.herding4health.net/contact" _hover={{ textDecoration: 'underline', textDecorationColor: 'white' }}>
                            <Text color="white" fontWeight={400} fontSize={16}>HELP</Text>
                        </Link>
                    </ListItem>
                    <ListItem
                        onMouseEnter={() => handleHoverEnter('about')}
                        onMouseLeave={handleHoverLeave}
                        style={{ textDecoration: isSelected('about') || isSelected('learn-more') ? 'underline' : 'none', textDecorationColor: 'white' }}
                    >
                        <Flex gap="4px" alignItems="center" cursor="pointer">
                            <Text color="white" fontWeight={400} fontSize={16}>ABOUT</Text>
                            <Image src="static/images/arrow_down.svg" alt="Dropdown Arrow" h="8px" w="16px" />
                        </Flex>
                        {hoveredSection === 'about' && <MegaMenu hoveredSection="about" isUserAvatarHovered={false} />}
                    </ListItem>
                    <ListItem
                        onMouseEnter={() => handleHoverEnter('resources')}
                        onMouseLeave={handleHoverLeave}
                        style={{ textDecoration: isSelected('resources') ? 'underline' : 'none', textDecorationColor: 'white' }}
                    >
                        <Flex gap="4px" alignItems="center" cursor="pointer">
                            <Text color="white" fontWeight={400} fontSize={16}>RESOURCES</Text>
                            <Image src="static/images/arrow_down.svg" alt="Dropdown Arrow" h="8px" w="16px" />
                        </Flex>
                        {hoveredSection === 'resources' && <MegaMenu hoveredSection="resources" isUserAvatarHovered={false} />}
                    </ListItem>
                </UnorderedList>

                {/* Right-aligned Icons (Desktop) and Hamburger (Mobile) */}
                <Flex alignItems="center">
                <Flex
                    display={{ base: "flex", sm: "flex" }}
                    gap="20px"
                >
                    {isAuthenticated && (
                        <>
                            <Link href="#">
                            <Image src="static/images/search_icon.svg" alt="search" h="24px" w="24px" />
                            </Link>
                            <Link href="#" pointerEvents="none">
                            <Image 
                                src="static/images/notifications_icon.svg" 
                                alt="Notif" 
                                h="24px" 
                                w="24px" 
                                opacity="0.5" 
                                cursor="not-allowed"
                            />
                            </Link>
                        </>
                        )}


                    {/* User Avatar - Conditionally rendered based on login status */}
                    {isAuthenticated ? (
                        <Link
                            onMouseEnter={() => handleHoverEnter('userAvatar')}
                            onMouseLeave={handleHoverLeave}
                        >
                            {/* Show logged-in user avatar */}
                            <Image src={"static/images/logged_in_user_avatar.svg"} alt="user" h="28px" w="28px" />
                            {hoveredSection === 'userAvatar' && <MegaMenu hoveredSection="userAvatar" isUserAvatarHovered={true} />}
                        </Link>
                    ) : (
                        <Link onClick={() => onOpen()}>
                            <Image src="static/images/user_avatar_header_icon.svg" alt="user" h="24px" />
                        </Link>
                    )}
                </Flex>

                {/* Hamburger Icon for Mobile */}
                <IconButton
                    display={{ base: "flex", sm: "none" }}
                    icon={isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
                    aria-label="Toggle Menu"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    bg="transparent"
                    color="white"
                    mr="-5px"
                    width={"5%"}
                    padding={0}
                    order={{ base: 3, sm: 0 }}
                />
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
                    position="fixed"
                    top="70px"
                    left="50%"
                    transform="translateX(-50%)"
                    zIndex={999}
                    boxShadow="0px 4px 12px rgba(0, 0, 0, 0.2)"
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
                        <ListItem onMouseEnter={() => handleHoverEnter('about')} onMouseLeave={handleHoverLeave}>
                            <Flex gap="4px" alignItems="center" cursor="pointer">
                                <Text>ABOUT</Text>
                                <Image src="static/images/arrow_down.svg" alt="Dropdown Arrow" h="8px" w="16px" />
                            </Flex>
                            {hoveredSection === 'about' && <MegaMenu hoveredSection="about" isUserAvatarHovered={false} />}
                        </ListItem>
                        <ListItem onMouseEnter={() => handleHoverEnter('resources')} onMouseLeave={handleHoverLeave}>
                            <Flex gap="4px" alignItems="center" cursor="pointer">
                                <Text>RESOURCES</Text>
                                <Image src="static/images/arrow_down.svg" alt="Dropdown Arrow" h="8px" w="16px" />
                            </Flex>
                            {hoveredSection === 'resources' && <MegaMenu hoveredSection="resources" isUserAvatarHovered={false} />}
                        </ListItem>
                    </UnorderedList>
                </Box>
            )}


            {/* Sign-In Modal */}
            <SignIn isOpen={isOpen} onClose={onClose} />
        </>
    );
}