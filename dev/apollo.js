const _ = require('lodash');
const http = require('http');
const gql = require('graphql-tag');
const { ApolloServer, PubSub } = require('apollo-server-express');
const { AuthenticationError, ForbiddenError } = require('apollo-server-errors');
const formatError = require('../src/utils/formatError');
const AuthorizationServer = require('../src/server/AuthorizationServer');

module.exports = ({ app }) => {
  const pubsub = new PubSub();

  const typeDefs = gql`
    interface Node {
      id: ID
    }
    type Query
    type Mutation

    extend type Query {
      node(id: ID!): Node
    }
  
    extend type Query {
      user: User
    }
    type User implements Node {
      id: ID
      name: String
    }

    extend type Mutation {
      setBookshelf(input: SetBookshelfInput!): SetBookshelfPayload
    }
    type Bookshelf implements Node {
      id: ID
      title: String
      usage: Int
    }
    input SetBookshelfInput {
      title: String
      pending: Int
    }
    type SetBookshelfPayload {
      status: String
      bookshelf: Bookshelf
    }

    extend type Query {
      tags: [Tag]
    }
    extend type Mutation {
      updateTag(input: UpdateTagInput!): UpdateTagPayload
    }
    type Tag implements Node {
      id: ID
      value: String
    }
    input UpdateTagInput {
      id: ID
      value: String
    }
    type UpdateTagPayload {
      status: String
      tag: Tag
    }
  
    extend type Query {
      posts: PostsPagination
    }
    extend type Mutation {
      addPost(input: AddPostInput!): AddPostPayload
    }
    type Post implements Node {
      id: ID
      content: String
    }
    type PostsPagination {
      totalCount: Int
      nodes: [Post]
      pageInfo: PageInfo
    }
    type PageInfo {
      next: String
      previous: String
    }
    input AddPostInput {
      content: String
    }
    type AddPostPayload {
      status: String
      post: Post
    }

    type Subscription {
      onAddPost: Post
    }
  `;

  const tags = {
    TAG_01: 'Tag 01',
    TAG_02: 'Tag 02',
  };

  const posts = [{
    id: Math.round(Math.random() * 0xFFFFFFFF),
    content: 'Post 01',
  }];

  const resolvers = {
    Node: {
      // eslint-disable-next-line no-underscore-dangle
      __resolveType() {
        return 'Tag';
      },
    },
    Query: {
      user: (__, ___, { passport }) => passport.user,
      node: (__, { id }) => ({ id, value: tags[id] }),
      tags: () => _.map(tags, (value, id) => ({ id, value })),
      posts: () => ({
        totalCount: posts.length,
        nodes: posts,
        pageInfo: {
          next: '',
          previous: '',
        },
      }),
    },
    Mutation: {
      async setBookshelf(__, { input }) {
        const timestamp = Date.now();
        if (input.pending === 0) throw new ForbiddenError('Cannot read bookshelf.');
        await new Promise((resolve) => setTimeout(resolve, input.pending || 0));
        return {
          status: 'ok',
          bookshelf: {
            id: 'ID:BOOKSHELF',
            title: input.title,
            usage: Date.now() - timestamp,
          },
        };
      },
      updateTag(__, { input }) {
        const { id, value } = input;
        return { status: 'ok', tag: { id, value } };
      },
      addPost: (__, { input: { content } }) => {
        posts.push();
        pubsub.publish('onAddPost', {
          onAddPost: { id: posts.length - 1, value: null },
        });
        return { status: 'ok', content };
      },
    },
    Subscription: {
      onAddPost: {
        subscribe: () => pubsub.asyncIterator(['onAddPost']),
      },
    },
  };

  const key = '61949dde6de8402e73f9a0251ca4542aba0e2c48b9297a9df61727ba892acddddc5f72b87838b88e834dedffc1977a74c42e59ccdfe4edd18026b7c5aa6972e1';
  const authorization = new AuthorizationServer(key, {
    signInHandler(params) {
      if (params.username === 'admin') {
        return { nickname: 'admin', isAdmin: true };
      }

      throw new AuthenticationError();
    },
    signOutHandler() {
      return {};
    },
    reviewHandler(params) {
      if (params.change === 'notfound') throw new AuthenticationError();
      return params;
    },
  });
  app.use('/authorization', authorization.express());

  app.use(authorization.expressParser());

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    subscriptions: { onConnect: authorization.connectParser() },
    context: authorization.apolloContext,
    formatError,
  });
  apolloServer.applyMiddleware({ app });

  const server = http.createServer(app);
  apolloServer.installSubscriptionHandlers(server);
};
