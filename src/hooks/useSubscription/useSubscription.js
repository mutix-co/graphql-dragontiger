import _ from 'lodash';
import React from 'react';

export function format(name, result, parent) {
  const { results, loading } = parent;

  return {
    ...result,
    results: { ...results, [name]: result },
    [name]: _.get(result, ['data', name]),
    loading: result.loading || loading || false,
  };
}

export default function useSubscription() {
  // eslint-disable-next-line no-unreachable
  return <div />;
}
