import React from 'react';
import { Box } from '@chakra-ui/core';

export type WrapperVariant = 'small' | 'regular' | 'wide';

interface WrapperProps {
  variant?: WrapperVariant;
}

const Wrapper: React.FC<WrapperProps> = ({ children, variant = 'regular' }) => {
  const maxWidth =
    variant === 'small' ? '400px' : variant === 'wide' ? '1180px' : '800px';
  return (
    <Box mx="auto" mt={8} maxW={maxWidth} w="100%">
      {children}
    </Box>
  );
};

export default Wrapper;
