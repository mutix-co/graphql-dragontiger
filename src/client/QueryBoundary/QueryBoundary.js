import React, { Suspense } from 'react';
import PropTypes from 'prop-types';
import QuerySpinner from './QuerySpinner';
import QueryError from './QueryError';

export default class QueryBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  onRetry() {
    this.setState({ error: null });
  }

  render() {
    const { children, fallback: Fallback, errorback: ErrorBack } = this.props;
    const { error } = this.state;

    // eslint-disable-next-line react/jsx-no-bind
    if (error !== null) return <ErrorBack error={error} onRetry={this.onRetry.bind(this)} />;

    return <Suspense fallback={<Fallback />}>{children}</Suspense>;
  }
}

QueryBoundary.propTypes = {
  fallback: PropTypes.func,
  errorback: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]).isRequired,
};

QueryBoundary.defaultProps = {
  fallback: QuerySpinner,
  errorback: QueryError,
};
