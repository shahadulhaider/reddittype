import { MiddlewareFn } from 'type-graphql';
import { AppContext } from '../typings';

export const isAuth: MiddlewareFn<AppContext> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error('Not Authenticated');
  }

  return next();
};
