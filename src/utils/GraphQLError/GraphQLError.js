module.exports = class GraphQLError extends Error {
  constructor(stacks) {
    super();
    this.name = 'GraphQLError';
    this.message = 'GraphQL mixed errors';
    this.stacks = stacks;
  }
};
