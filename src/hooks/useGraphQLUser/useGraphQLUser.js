import { useContext } from 'react';
import { GraphQLUserContext } from '../../client/GraphQLProvider';

export default function useAuthenticatorUser() {
  const user = useContext(GraphQLUserContext);
  return user;
}
