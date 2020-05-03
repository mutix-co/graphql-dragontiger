const { ApolloError } = require('apollo-server-errors');
const { GraphQLError } = require('graphql/error');

module.exports = function formatError(error) {
  const { name, message, path } = error;
  if (error instanceof GraphQLError || error instanceof ApolloError) {
    return {
      name, code: error.extensions.code, message, path,
    };
  }
  return { code: 'UNKNOWN', path, message: 'An unknown error occurred' };
};
