import { Flex, IconButton } from '@chakra-ui/core';
import React, { useState } from 'react';
import { PostSnippetFragment, useVoteMutation } from '../generated/graphql';

interface UpvoteSectionProops {
  post: PostSnippetFragment;
}

export const UpvoteSection: React.FC<UpvoteSectionProops> = ({ post }) => {
  const [loadingState, setLoadingState] = useState<
    'upvote-loading' | 'downvote-loading' | 'not-loading'
  >();

  const [, vote] = useVoteMutation();

  return (
    <Flex direction="column" justify="space-around" align="center" mr={2}>
      <IconButton
        onClick={async () => {
          if (post.voteStatus === 1) {
            return;
          }
          setLoadingState('upvote-loading');
          await vote({
            postId: post.id,
            value: 1,
          });
          setLoadingState('not-loading');
        }}
        isLoading={loadingState === 'upvote-loading'}
        variantColor={post.voteStatus === 1 ? 'purple' : undefined}
        icon="chevron-up"
        aria-label="upvote post"
      />
      {post.points}
      <IconButton
        onClick={async () => {
          if (post.voteStatus === -1) {
            return;
          }
          setLoadingState('downvote-loading');
          await vote({
            postId: post.id,
            value: -1,
          });
          setLoadingState('not-loading');
        }}
        isLoading={loadingState === 'downvote-loading'}
        variantColor={post.voteStatus === -1 ? 'red' : undefined}
        icon="chevron-down"
        aria-label="downvote post"
      />
    </Flex>
  );
};
