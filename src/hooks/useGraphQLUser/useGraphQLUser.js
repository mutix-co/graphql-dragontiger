import React, { useContext } from 'react';
import { GraphQLUserContext } from '../../client/GraphQLProvider';

export default function useGraphQLUser() {
  const user = useContext(GraphQLUserContext);
  return user;

  // eslint-disable-next-line no-unreachable
  return <div />;
}
