import { Box, Button } from '@chakra-ui/core';
import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import React from 'react';
import InputField from '../../../components/InputField';
import Layout from '../../../components/Layout';
import { useUpdatePostMutation } from '../../../generated/graphql';
import { createUrqlClient } from '../../../utils/createUrqlClient';
import { useIsAuth } from '../../../utils/useIsAuth';

const EditPost = () => {
  useIsAuth();

  const router = useRouter();
  const [, updatePost] = useUpdatePostMutation();

  return (
    <Layout variant="small">
      <Formik
        initialValues={{
          title: '',
          text: '',
        }}
        onSubmit={async values => {
          const { error } = await updatePost({ input: values });
          if (!error) {
            router.push('/');
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="title"
              placeholder="title"
              label="Title"
              required
            />
            <Box mt={4}>
              <InputField
                textarea
                name="text"
                placeholder="text..."
                label="Body"
                required
              />
            </Box>
            <Button
              mt={4}
              type="submit"
              variantColor="purple"
              isLoading={isSubmitting}
            >
              Create Post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(EditPost);
