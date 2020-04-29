import {
  useEffect, useCallback, useState, useMemo,
} from 'react';
import getFieldName from '../../utils/getFieldName';
import useDefaults from '../useDefaults';
import { useGraphQLClient } from '..';

export default function usePagination(tag, ...args) {
  const client = useGraphQLClient();
  const variables = useDefaults(args[0]);
  const params = useDefaults(args[1]);
  const [next, setNext] = useState();
  const [previous, setPrevious] = useState();
  const [cursor, setCursor] = useState();
  const [data, setData] = useState();
  const [error, setError] = useState();

  useEffect(() => setCursor(undefined), [variables]);

  const fetchNext = useCallback(() => setCursor(next), [next]);
  const fetchPrevious = useCallback(() => setCursor(previous), [previous]);

  const hash = useMemo(
    () => `${client.gqlPrint(tag)}:${JSON.stringify({ ...variables, cursor })}`,
    [client, tag, variables, cursor],
  );

  const refresh = useCallback(
    () => client.execute({
      ...params,
      hash,
      data: { query: client.gqlPrint(tag), variables: { ...variables, cursor } },
    }),
    [client, tag, variables, cursor, hash, params],
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
        const result = res.data[field];
        setData(result.nodes);
        setNext(result.pageInfo.next);
        setPrevious(result.pageInfo.previous);
      } catch (err) {
        setError(err);
      }
    });
    return unlistener;
  }, [client, tag, hash]);

  if (error) throw error;

  const actions = {
    refresh,
    fetchPrevious,
    fetchNext,
    hasPrevious: previous !== undefined,
    hasNext: next !== undefined,
  };
  return [data, actions];
}
