import { FieldError } from '../resolvers/FieldError';
import { UsernamePasswordInput } from '../resolvers/UsernamePasswordInput';

export const validateRegister = (options: UsernamePasswordInput): FieldError[] | null => {
  const { email, username, password } = options;

  if (!email.includes('@')) {
    return [
      {
        field: 'email',
        message: 'invalid email',
      },
    ];
  }

  if (username.length <= 2) {
    return [
      {
        field: 'username',
        message: 'username too short',
      },
    ];
  }

  if (username.includes('@')) {
    return [
      {
        field: 'username',
        message: 'can not include an @',
      },
    ];
  }

  if (password.length <= 4) {
    return [
      {
        field: 'password',
        message: 'password too short',
      },
    ];
  }

  return null;
};
