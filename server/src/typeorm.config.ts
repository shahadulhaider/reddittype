import path from 'path';
import { ConnectionOptions } from 'typeorm';
import { Post } from './entities/Post';
import { Upvote } from './entities/Upvote';
import { User } from './entities/User';

export const typeormConfig: ConnectionOptions = {
  type: 'postgres',
  database: 'creddit-dev',
  username: 'jewel',
  password: 'habijabi',
  logging: true,
  synchronize: true,
  entities: [User, Post, Upvote],
  migrations: [path.join(__dirname, './migration/*')],
  cli: {
    migrationsDir: 'migration',
  },
};
