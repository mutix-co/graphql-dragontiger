import React, { useContext } from 'react';
import { GraphQLClientContext } from '../../client/GraphQLProvider';

export default function useGraphQLClient() {
  const client = useContext(GraphQLClientContext);
  return client;

  // eslint-disable-next-line no-unreachable
  return <div />;
}
