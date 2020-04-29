import { useContext } from 'react';
import { GraphQLClientContext } from '../../client/GraphQLProvider';

export default function useGraphQLClient() {
  const client = useContext(GraphQLClientContext);
  return client;
}
