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

  const key = [
    252, 174, 214, 54, 179, 95, 188, 242, 222, 218, 124, 247, 30, 173, 2, 96, 9, 175, 215,
    227, 220, 37, 125, 246, 10, 76, 0, 142, 77, 101, 166, 183, 73, 19, 148, 226, 104, 133,
    15, 133, 216, 42, 141, 191, 240, 251, 179, 25, 66, 233, 239, 242, 250, 138, 210, 242,
    150, 78, 16, 107, 46, 44, 179, 22,
  ];
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

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: authorization.contextParser(),
    formatError,
  });
  apolloServer.applyMiddleware({ app });

  const server = http.createServer(app);
  apolloServer.installSubscriptionHandlers(server);
};
