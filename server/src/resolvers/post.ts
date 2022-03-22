import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { getConnection, LessThan } from 'typeorm';
import { Post } from '../entities/Post';
import { Upvote } from '../entities/Upvote';
import { User } from '../entities/User';
import { isAuth } from '../middleware/isAuth';
import { AppContext } from '../typings';
import { PaginatedPosts } from './PaginatedPosts';
import { PostInput } from './PostInput';

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() post: Post): string {
    return post.text.slice(0, 50);
  }

  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: AppContext) {
    return userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(@Root() post: Post, @Ctx() { upvoteLoader, req }: AppContext) {
    if (!req.session.userId) {
      return null;
    }

    const upvote = await upvoteLoader.load({
      postId: post.id,
      userId: req.session.userId,
    });

    return upvote ? upvote.value : null;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null,
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const take = realLimit + 1;

    // const qb = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder('p')
    //   .orderBy('"createdAt"', 'DESC')
    //   .take(take);

    // if (cursor) {
    //   qb.where('"createdAt" < :cursor', {
    //     cursor: new Date(parseInt(cursor, 10)),
    //   });
    // }

    // const postfeed = await qb.getMany();

    const postfeed = await getConnection()
      .getRepository(Post)
      .find({
        where: cursor ? { createdAt: LessThan(new Date(parseInt(cursor, 10))) } : {},
        relations: ['creator'],
        order: { createdAt: 'DESC' },
        take,
      });

    return {
      postfeed: postfeed.slice(0, realLimit),
      hasMore: postfeed.length === take,
    };
  }

  @Query(() => Post, { nullable: true })
  async post(@Arg('id', () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id, { relations: ['creator'] });
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req }: AppContext,
  ): Promise<Post | undefined> {
    const post = Post.create({
      ...input,
      creatorId: req.session.userId,
    });
    await post.save();

    return post;
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg('id', () => Int) id: number,
    @Arg('title') title: string,
    @Arg('text') text: string,
    @Ctx() { req }: AppContext,
  ): Promise<Post | null> {
    const post = await Post.findOne(id);

    if (!post) return null;

    if (post.creatorId !== req.session.userId) {
      throw new Error('Not Authorized');
    }

    const updatedPost = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning('*')
      .execute();

    return updatedPost.raw[0] as Post;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(@Arg('id', () => Int) id: number, @Ctx() { req }: AppContext): Promise<boolean> {
    const post = await Post.findOne(id);

    if (!post) {
      return false;
    }

    if (post.creatorId !== req.session.userId) {
      throw new Error('Not Authorized');
    }

    await Upvote.delete({ postId: id });
    await Post.delete({ id });
    return true;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: AppContext,
  ) {
    const { userId } = req.session;
    const isUpvote = value !== -1;
    const realValue = isUpvote ? 1 : -1;

    // await Upvote.insert({
    //   userId,
    //   postId,
    //   value: realValue,
    // });

    const upvote = await Upvote.findOne({ where: { postId, userId } });
    // already voted, wants to change it
    if (upvote && upvote.value !== realValue) {
      await getConnection().transaction(async tm => {
        await tm.query(
          `
            update upvote
            set value = $1
            where "postId" = $2 and "userId" = $3
          `,
          [realValue, postId, userId],
        );

        await tm.query(
          `
            update post
            set points = points + $1
            where id = $2
        `,
          [2 * realValue, postId],
        );
      });
    } else if (upvote && upvote.value === realValue) {
      console.log(`cant upvote or downvote same post(id: ${upvote.postId}) twice!`);
    } else if (!upvote) {
      // didn't vote yet
      await getConnection().transaction(async tm => {
        await tm.query(
          `
            insert into upvote ("userId", "postId", value)
            values ($1, $2, $3);
          `,
          [userId, postId, realValue],
        );

        await tm.query(
          `
            update post
            set points = points + $1
            where id = $2
        `,
          [realValue, postId],
        );
      });
    }

    return true;
  }
}
