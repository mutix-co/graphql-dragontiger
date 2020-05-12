import React from 'react';
import PropTypes from 'prop-types';

export default function Example({ name, children }) {
  return <div data-testid={name === undefined ? 'Example' : `Example-${name}`}>{children}</div>;
}

Example.propTypes = {
  name: PropTypes.string,
  children: PropTypes.node.isRequired,
};

Example.defaultProps = {
  name: undefined,
};
