import {
  useEffect, useCallback, useState, useMemo,
} from 'react';
import getFieldName from '../../utils/getFieldName';
import useDefaults from '../useDefaults';
import { useGraphQLClient } from '..';

export default function useQuery(tag, ...args) {
  const client = useGraphQLClient();
  const variables = useDefaults(args[0]);
  const params = useDefaults(args[1], {
    pollInterval: 0,
  });
  const [data, setData] = useState();
  const [error, setError] = useState();

  const hash = useMemo(
    () => `${client.gqlPrint(tag)}:${JSON.stringify(variables)}`,
    [client, tag, variables],
  );

  const refresh = useCallback(
    () => client.execute({ ...params, data: { query: client.gqlPrint(tag), variables }, hash }),
    [client, tag, variables, hash, params],
  );

  if (client.cache.has(hash) === false) throw refresh();

  useEffect(() => {
    if (client.cache.expired(hash) === true) refresh();
  }, [client, hash, refresh]);

  useEffect(() => {
    const field = getFieldName(tag);
    const unlistener = client.listeners.addListener(hash, (res) => {
      try {
        if (res instanceof Error) throw res;
        setData(res.data[field]);
      } catch (err) {
        setError(err);
      }
    });
    return unlistener;
  }, [client, tag, hash]);

  if (error) throw error;

  return [data, { refresh }];
}
