import { Box, IconButton, Link } from '@chakra-ui/core';
import React from 'react';
import NextLink from 'next/link';
import { useDeletePostMutation } from '../generated/graphql';

interface Props {
  id: number;
}

const EditDeletePostButtons: React.FC<Props> = ({ id }) => {
  const [, deletePost] = useDeletePostMutation();

  return (
    <Box>
      <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
        <IconButton as={Link} mr={4} icon="edit" aria-label="Edit post" />
      </NextLink>
      <IconButton
        icon="delete"
        aria-label="Delete post"
        onClick={() => {
          deletePost({ id });
        }}
      />
    </Box>
  );
};

export default EditDeletePostButtons;
