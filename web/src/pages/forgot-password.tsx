import { Box, Button } from '@chakra-ui/core';
import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import React, { useState } from 'react';
import InputField from '../components/InputField';
import Layout from '../components/Layout';
import { useForgotPasswordMutation } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';

const ForgotPassword: React.FC<{}> = () => {
  const [complete, setComplete] = useState(false);

  const [, forgot] = useForgotPasswordMutation();

  return (
    <Layout variant="small">
      <Formik
        initialValues={{
          email: '',
        }}
        onSubmit={async values => {
          await forgot(values);
          setComplete(true);
        }}
      >
        {({ isSubmitting }) =>
          complete ? (
            <Box>
              An email with password reset link has been sent. <br />
              Please check.
            </Box>
          ) : (
            <Form>
              <InputField
                name="email"
                placeholder="email"
                label="Email"
                type="email"
                required
              />
              <Button
                mt={4}
                type="submit"
                variantColor="purple"
                isLoading={isSubmitting}
              >
                Forgot Password
              </Button>
            </Form>
          )
        }
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(ForgotPassword);
