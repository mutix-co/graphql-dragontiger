import _ from 'lodash';

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

}
