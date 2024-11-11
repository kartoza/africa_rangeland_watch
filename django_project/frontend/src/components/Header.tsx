import React, { useState } from 'react';
import { Flex, Box, Text, Image, UnorderedList, ListItem, Link, IconButton } from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import MegaMenu from './MegaMenu';
import SignIn from './SignIn';

export default function Header(props: any) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuOpenAlt, setMenuOpenAlt] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSignInOpen, setIsSignInOpen] = useState(false);

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
                >
                    <ListItem>
                        <Link href="#"><Text color="white">MAP</Text></Link>
                    </ListItem>
                    <ListItem>
                        <Link href="#"><Text color="white">DASHBOARD</Text></Link>
                    </ListItem>
                    <ListItem>
                        <Link href="#"><Text color="white">HELP</Text></Link>
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
                        <Link href="#"><Image src="static/images/search_icon.svg" alt="search" h="24px" /></Link>
                        <Link href="#"><Image src="static/images/notifications_icon.svg" alt="Notif" h="24px" w="24px" /></Link>
                        <Link onClick={() => setIsSignInOpen(true)}>
                            <Image src="images/user_avatar_header_icon.svg" alt="user" h="24px" />
                        </Link>
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
                    top="4.5%"
                    left="15%"
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
                        <ListItem><Link href="#"><Text>MAP</Text></Link></ListItem>
                        <ListItem><Link href="#"><Text>DASHBOARD</Text></Link></ListItem>
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
        </>
    );
}
