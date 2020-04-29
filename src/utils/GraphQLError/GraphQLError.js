export default class GraphQLError extends Error {
  constructor(stacks) {
    super();
    this.name = 'GraphQLError';
    this.stacks = stacks;
  }
}
