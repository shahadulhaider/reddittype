import argon2 from 'argon2';
import { Arg, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from 'type-graphql';
import { v4 } from 'uuid';
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from '../constants';
import { User } from '../entities/User';
import { AppContext } from '../typings/types';
import { sendEmail } from '../utils/sendEmail';
import { validateRegister } from '../utils/validateRegister';
import { UsernamePasswordInput } from './UsernamePasswordInput';
import { UserResponse } from './UserResponse';

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: AppContext): string {
    if (req.session.userId === user.id) {
      return user.email;
    }
    return '';
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: AppContext): Promise<User | undefined> {
    if (!req.session.userId) {
      return undefined;
    }
    const user = await User.findOne(req.session.userId);

    return user;
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { redis }: AppContext,
  ): Promise<boolean> {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return false;
    }

    const token = v4();

    await redis.set(FORGOT_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 24 * 3);

    const body = `<a href="http://localhost:3000/change-password/${token}">Reset Password</a>`;

    await sendEmail(email, body);

    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis, req }: AppContext,
  ): Promise<UserResponse> {
    if (newPassword.length <= 4) {
      return {
        errors: [
          {
            field: 'newPassword',
            message: 'password too short',
          },
        ],
      };
    }
    const key = FORGOT_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);

    if (!userId) {
      return {
        errors: [
          {
            field: 'token',
            message: 'token expired',
          },
        ],
      };
    }

    const userID = parseInt(userId,10);
    const user = await User.findOne(userID);

    if (!user) {
      return {
        errors: [
          {
            field: 'token',
            message: 'user no longer exists',
          },
        ],
      };
    }

    await User.update(
      { id: userID },
      {
        password: await argon2.hash(newPassword),
      },
    );

    // remove one-time key
    await redis.del(key);

    // log in user after password change
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { req }: AppContext,
  ): Promise<UserResponse | undefined> {
    const { username, email, password } = options;

    const errors = validateRegister(options);

    if (errors) {
      return { errors };
    }

    const hashed = await argon2.hash(password);
    let user = new User();

    try {
      user = await User.create({
        username,
        email,
        password: hashed,
      }).save();
      // const result = await (db as EntityManager)
      //   .createQueryBuilder(User)
      //   .getKnexQuery()
      //   .insert({
      //     username,
      //     email,
      //     password: hashed,
      //     created_at: new Date(),
      //     updated_at: new Date(),
      //   })
      //   .returning('*');
    } catch (err) {
      console.log(err);
      if (err.code === '23505') {
        if (err.detail.includes('username')) {
          return {
            errors: [
              {
                field: 'username',
                message: 'username already taken',
              },
            ],
          };
        }

        if (err.detail.includes('email')) {
          return {
            errors: [
              {
                field: 'email',
                message: 'email already taken',
              },
            ],
          };
        }
      }
    }

    req.session.userId = user.id;
    return {
      user,
    };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { req }: AppContext,
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameOrEmail.includes('@')
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } },
    );

    if (!user) {
      return {
        errors: [
          {
            field: 'usernameOrEmail',
            message: "user doesn't exist with given email or username",
          },
        ],
      };
    }

    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect password',
          },
        ],
      };
    }

    req.session.userId = user.id;

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: AppContext): Promise<boolean> {
    return new Promise(resolve =>
      req.session.destroy(err => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }

        resolve(true);
      }),
    );
  }
}
