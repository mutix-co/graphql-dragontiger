import { useContext } from 'react';
import { GraphQLUserContext } from '../../client/GraphQLProvider';

export default function useGraphQLUser() {
  const { user, suspense } = useContext(GraphQLUserContext);
  if (suspense !== null) throw suspense;
  return user;
}
