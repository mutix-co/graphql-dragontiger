import forEach from 'lodash/forEach';
import React from 'react';
import PropTypes from 'prop-types';
import useGraphQLProvider from '../src/hooks/useGraphQLProvider';
import GraphQLProvider from '../src/client/GraphQLProvider';

export default function Wrapper({ children }) {
  const [client, user] = useGraphQLProvider({
    errorHander(error) {
      // eslint-disable-next-line no-console
      forEach(error.stacks, (stack) => console.log(stack.message));
    },
  });
  return (
    <GraphQLProvider client={client} user={user}>
      {children}
    </GraphQLProvider>
  );
}

Wrapper.propTypes = {
  children: PropTypes.node.isRequired,
};
