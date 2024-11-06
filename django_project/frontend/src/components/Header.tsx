import React, { useState } from 'react';
import { Flex, Text, Image, UnorderedList, ListItem, Link, IconButton, useDisclosure } from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import MegaMenu from './MegaMenu';
import SignIn from './SignIn';

export default function Header(props: any) {
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [menuOpenAlt, setMenuOpenAlt] = React.useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isSignInOpen, setIsSignInOpen] = useState(false);

    return (
        <Flex
            {...props}
            bg="dark_green.800"
            justifyContent="space-between"
            alignItems="center"
            px="16px"
            py="4px"
            flexDirection={{ base: "column", sm: "row" }}
            as="header"
            w="100%"
        >
            {/* Logo Section */}
            <Flex alignItems="center" flex="1">
                <Image src="images/main_logo.svg" alt="Header Logo" h="52px" w="190px" fit="contain" />
            </Flex>

            {/* Menu Items */}
            <UnorderedList
                styleType="none"
                gap="44px"
                display={{ base: isMobileMenuOpen ? "flex" : "none", sm: "flex" }}
                flexDirection={{ base: "column", sm: "row" }}
                alignItems={{ base: "center", sm: "flex-start" }}
            >
                {/* Other menu items */}
                <ListItem>
                    <Link href="#">
                        <Text>MAP</Text>
                    </Link>
                </ListItem>
                <ListItem>
                    <Link href="#">
                        <Text>DASHBOARD</Text>
                    </Link>
                </ListItem>
                <ListItem>
                    <Link href="#">
                        <Text>HELP</Text>
                    </Link>
                </ListItem>
                <ListItem
                    onMouseLeave={() => setMenuOpen(false)}
                    onMouseEnter={() => setMenuOpen(true)}
                >
                    <Flex gap="4px" alignItems="center" cursor="pointer">
                        <Text>ABOUT</Text>
                        <Image src="images/arrow_down.svg" alt="Dropdown Arrow" h="8px" w="16px" />
                    </Flex>
                    {menuOpen ? <MegaMenu /> : null}
                </ListItem>
                <ListItem
                    onMouseLeave={() => setMenuOpenAlt(false)}
                    onMouseEnter={() => setMenuOpenAlt(true)}
                >
                    <Flex gap="4px" alignItems="center" cursor="pointer">
                        <Text>RESOURCES</Text>
                        <Image src="images/arrow_down.svg" alt="Dropdown Arrow" h="8px" w="16px" />
                    </Flex>
                    {menuOpenAlt ? <MegaMenu /> : null}
                </ListItem>
            </UnorderedList>

            {/* Icons and Mobile Menu Toggle */}
            <Flex
                alignItems="center"
                gap="20px"
                flex="1"
                justifyContent="flex-end"
            >
                <IconButton
                    display={{ base: "flex", sm: "none" }}
                    icon={isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
                    aria-label="Toggle Menu"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    bg="transparent"
                />
                <Flex
                    display={{ base: "none", sm: "flex" }}
                    gap="20px"
                >
                    <Link href="#">
                        <Image src="images/search_icon.svg" alt="search" h="24px" />
                    </Link>
                    <Link href="#">
                        <Image src="images/notifications_icon.svg" alt="Notif" h="24px" w="24px" />
                    </Link>
                    <Link onClick={() => setIsSignInOpen(true)}> {/* Trigger modal on avatar click */}
                        <Image src="images/user_avatar_header_icon.svg" alt="user" h="24px" />
                    </Link>
                </Flex>
            </Flex>

            {/* Sign-In Modal */}
            <SignIn isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
        </Flex>
    );
}
