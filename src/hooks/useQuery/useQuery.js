/* eslint-disable react/require-default-props */
/* eslint-disable react/no-unused-prop-types */

import {
  useEffect, useCallback, useReducer, useMemo,
} from 'react';
import PropTypes from 'prop-types';
import getFieldName from '../../utils/getFieldName';
import useDefaults from '../useDefaults';
import { useGraphQLClient } from '..';

export default function useQuery(tag, ...args) {
  const client = useGraphQLClient();
  const variables = useDefaults(args[0]);
  const params = useDefaults(args[1], {
    pollInterval: 0,
  });
  const [, forceUpdate] = useReducer((i) => i + 1, 0);

  const hash = useMemo(
    () => `${client.gqlPrint(tag)}:${JSON.stringify(variables)}`,
    [client, tag, variables],
  );

  const refresh = useCallback(
    () => client.execute({ ...params, data: { query: client.gqlPrint(tag), variables }, hash }),
    [client, tag, variables, hash, params],
  );

  useEffect(() => {
    if (client.cache.expired(hash)) refresh();
  }, [client, hash, refresh]);

  useEffect(() => client.listeners.addListener(hash, () => forceUpdate()), [client, hash]);

  if (client.cache.has(hash) === false) {
    return [null, { error: null, refresh, suspense: refresh() }];
  }

  const result = client.cache.get(hash);
  if (result instanceof Error) return [null, { result, refresh, suspense: result }];

  const field = getFieldName(tag);
  return [result[field], { error: null, refresh, suspense: null }];
}

useQuery.propTypes = {
  GRAPHQL_TAG: PropTypes.string.isRequired,
  variables: PropTypes.objectOf(PropTypes.oneOfType()),
  'params.pollInterval': PropTypes.number,
};
