const _ = require('lodash');
const http = require('http');
const gql = require('graphql-tag');
const { ApolloServer, PubSub } = require('apollo-server-express');
const { ForbiddenError } = require('apollo-server-errors');
const { Base } = require('jw25519');
const formatError = require('../src/utils/formatError');
const AuthorizationServer = require('../src/server/AuthorizationServer/AuthorizationServer');

const { base16 } = Base;
const key = base16.decode('fcaed636b35fbcf2deda7cf71ead026009afd7e3dc257df60a4c008e4d65a6b7491394e268850f85d82a8dbff0fbb31942e9eff2fa8ad2f2964e106b2e2cb316');

module.exports = ({ app }) => {
  const pubsub = new PubSub();

  const authorization = new AuthorizationServer(key);
  app.post('/auth', authorization.express());

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
