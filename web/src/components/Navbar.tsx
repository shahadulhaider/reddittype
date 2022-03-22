import { Box, Button, Flex, Link } from '@chakra-ui/core';
import NextLink from 'next/link';
import React from 'react';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { isServer } from '../utils/isServer';
import NavWrapper from './NavWrapper';

interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = ({}) => {
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  const [{ data, fetching }] = useMeQuery({
    pause: isServer(),
  });

  let authLinks;

  if (fetching) {
    authLinks = null;
  } else if (!data?.me) {
    authLinks = (
      <>
        <NextLink href="/login">
          <Link ml={4}>Login</Link>
        </NextLink>
        <NextLink href="/register">
          <Link ml={4}>Register</Link>
        </NextLink>
      </>
    );
  } else {
    authLinks = (
      <Flex align="center">
        <Box>
          <NextLink href="/create-post">
            <Button
              as={Link}
              variantColor="blue"
              _hover={{ textDecor: 'none' }}
            >
              Create Post
            </Button>
          </NextLink>
        </Box>
        {/* <Box>{data.me.username}</Box>  */}
        <Button
          onClick={() => {
            logout();
          }}
          isLoading={logoutFetching}
          as={Link}
          ml={2}
          variantColor="white"
          _hover={{ textDecor: 'none' }}
        >
          Logout
        </Button>
      </Flex>
    );
  }

  return (
    <Box bg="rebeccapurple">
      <NavWrapper variant="wide">
        <Flex height="68px" justify="space-between" align="center">
          <NextLink href="/">
            <Link
              color="white"
              fontSize="2.2rem"
              _hover={{ textDecoration: 'none' }}
            >
              Creddit
            </Link>
          </NextLink>
          <Box color="white" mx={6}>
            {authLinks}
          </Box>
        </Flex>
      </NavWrapper>
    </Box>
  );
};

export default Navbar;
