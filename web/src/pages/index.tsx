import { Box, Button, Flex, Heading, Link, Stack, Text } from '@chakra-ui/core';
import { withUrqlClient } from 'next-urql';
import NextLink from 'next/link';
import React, { useState } from 'react';
import EditDeletePostButtons from '../components/EditDeletePostButtons';
import Layout from '../components/Layout';
import { UpvoteSection } from '../components/UpvoteSection';
import { useMeQuery, usePostsQuery } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 15,
    cursor: null as null | string,
  });

  const [{ data, fetching }] = usePostsQuery({
    variables,
  });

  const [{ data: meData }] = useMeQuery();

  const { postfeed: feed, hasMore } = data.posts;

  if (!fetching && !data) {
    return <div>Oups! Could not fetch any posts! </div>;
  }

  return (
    <Layout>
      <br />
      {fetching && !data ? (
        <div>loading...</div>
      ) : (
        <Stack spacing={8}>
          {feed &&
            feed.map(p =>
              !p ? null : (
                <Flex key={p.id} p={5} shadow="md" borderWidth="1px">
                  <UpvoteSection post={p} />
                  <Box flex={1}>
                    <NextLink href="/post/[id]" as={`/post/${p.id}`}>
                      <Link>
                        <Heading fontSize="xl">{p.title}</Heading>
                      </Link>
                    </NextLink>
                    <Text as="em">Posted By: {p.creator.username}</Text>
                    <Flex>
                      <Text flex={1} mt={4}>
                        {p.textSnippet}
                      </Text>
                      {meData?.me?.id === p.creator.id && (
                        <EditDeletePostButtons id={p.id} />
                      )}
                    </Flex>
                  </Box>
                </Flex>
              ),
            )}
        </Stack>
      )}
      {feed && hasMore ? (
        <Flex justify="center">
          <Button
            onClick={() => {
              setVariables({
                limit: variables.limit,
                cursor: feed[feed.length - 1].createdAt,
              });
            }}
            isLoading={fetching}
            my={8}
          >
            load more
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
