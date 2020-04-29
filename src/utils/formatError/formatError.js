module.exports = function formatError(error) {
  const { message, path } = error;
  if (String(error.name) === 'GraphQLError') {
    return { code: error.extensions.code, message, path };
  }
  return { code: 'UNKNOWN', path, message: 'An unknown error occurred' };
};
