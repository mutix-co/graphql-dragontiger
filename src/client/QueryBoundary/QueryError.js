import React from 'react';
import PropTypes from 'prop-types';

export default function QueryError({ error, onRetry }) {
  return (
    <div click={onRetry}>{error.message}</div>
  );
}

QueryError.propTypes = {
  error: PropTypes.instanceOf(Error).isRequired,
  onRetry: PropTypes.func.isRequired,
};
