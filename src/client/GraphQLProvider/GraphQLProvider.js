import React from 'react';
import PropTypes from 'prop-types';

export const GraphQLClientContext = React.createContext();

export const GraphQLUserContext = React.createContext();

export default function GraphQLProvider({ client, user, children }) {
  return (
    <GraphQLClientContext.Provider value={client}>
      <GraphQLUserContext.Provider value={user}>
        {children}
      </GraphQLUserContext.Provider>
    </GraphQLClientContext.Provider>
  );
}

GraphQLProvider.propTypes = {
  client: PropTypes.shape({}),
  user: PropTypes.shape({}),
  children: PropTypes.node,
};

GraphQLProvider.defaultProps = {
  client: undefined,
  user: undefined,
  children: undefined,
};
