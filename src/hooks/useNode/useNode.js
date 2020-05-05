/* eslint-disable react/require-default-props */
/* eslint-disable react/no-unused-prop-types */

import React, {
  useEffect, useCallback, useMemo, useReducer,
} from 'react';
import PropTypes from 'prop-types';
import useDefaults from '../useDefaults';
import { useGraphQLClient } from '..';

export default function useNode(id, ...args) {
  const client = useGraphQLClient();
  const params = useDefaults(args[0], {
    query: undefined,
  });
  const [, forceUpdate] = useReducer((i) => i + 1, 0);

  const nodeId = `NODE:${id}`;

  const hash = useMemo(
    () => (params.query !== undefined ? `${client.gqlPrint(params.query)}:${JSON.stringify({ id })}` : null),
    [client, params, id],
  );

  const refresh = useCallback(
    () => {
      if (hash === null) return Promise.resolve();

      const query = client.gqlPrint(params.query);
      const variables = { id };
      return client.execute({ ...params, data: { query, variables }, hash });
    },
    [client, id, params, hash],
  );

  useEffect(() => {
    if (hash !== null && client.cache.expired(hash)) refresh();
  }, [client, hash, refresh]);

  useEffect(() => client.listeners.addListener(nodeId, () => forceUpdate()), [client, nodeId]);

  if (client.cache.has(nodeId) === false) {
    const error = client.cache.get(hash);
    if (error instanceof Error) return [null, { error, refresh, suspense: error }];

    const suspense = hash !== null
      ? refresh() : new Promise((resolve) => client.listeners.once(nodeId, () => resolve()));
    return [null, { error: null, refresh, suspense }];
  }

  const node = client.cache.get(nodeId);
  return [node, { error: null, refresh, suspense: null }];

  // eslint-disable-next-line no-unreachable
  return <div />;
}

useNode.propTypes = {
  id: PropTypes.string.isRequired,
  'params.query': PropTypes.string,
};
