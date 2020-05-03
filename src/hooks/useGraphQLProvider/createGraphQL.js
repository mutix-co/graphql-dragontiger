import { print } from 'graphql/language/printer';
import assertResult from '../../utils/assertResult';
import getFieldName from '../../utils/getFieldName';

export default function createGraphQL({
  execute,
}) {
  const gqlCache = new Map();
  const gqlPrint = (tag) => {
    if (gqlCache.has(tag) === false) {
      gqlCache.set(tag, print(assertResult(tag, new Error('graphql-tag query is required'))));
    }
    return gqlCache.get(tag);
  };

  return {
    gqlPrint,
    async query(tag, variables = {}, params = {}) {
      const query = gqlPrint(tag);
      const hash = `${query}:${JSON.stringify(variables)}`;
      const data = { query, variables };
      const response = await execute({ ...params, data, hash });
      const field = getFieldName(tag);
      return response[field];
    },
    async mutate(tag, input = {}, params = {}) {
      const query = gqlPrint(tag);
      const data = { query, variables: { input } };
      const response = await execute({ ...params, data });
      const field = getFieldName(tag);
      return response[field];
    },
    subscribe() {
      return null;
    },
  };
}
