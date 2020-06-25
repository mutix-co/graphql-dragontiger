import React, { Suspense } from 'react';
import PropTypes from 'prop-types';
import QuerySpinner from './QuerySpinner';
import QueryError from './QueryError';

export default class QueryBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.onRetry = () => this.setState({ error: null });
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    this.setState({ error });
    return false;
  }

  render() {
    const {
      className,
      fallback: Fallback,
      errorback: ErrorBack,
      children,
    } = this.props;
    const { error } = this.state;

    if (error !== null) {
      return <ErrorBack className={className} error={error} onRetry={this.onRetry} />;
    }

    return <Suspense fallback={<Fallback className={className} />}>{children}</Suspense>;
  }
}

QueryBoundary.propTypes = {
  className: PropTypes.string,
  fallback: PropTypes.func,
  errorback: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]).isRequired,
};

QueryBoundary.defaultProps = {
  className: '',
  fallback: QuerySpinner,
  errorback: QueryError,
};
