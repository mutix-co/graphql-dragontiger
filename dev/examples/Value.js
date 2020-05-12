import React from 'react';
import PropTypes from 'prop-types';

export default function Value({ name, children }) {
  return (
    <div data-testid={name === undefined ? 'Value' : `Value-${name}`}>
      <span>{`${name}:`}</span>
      <span data-testid="value">{children}</span>
    </div>
  );
}

Value.propTypes = {
  name: PropTypes.string,
  children: PropTypes.node.isRequired,
};

Value.defaultProps = {
  name: undefined,
};
