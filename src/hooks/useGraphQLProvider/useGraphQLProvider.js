import { useRef, useState } from 'react';
import isEqual from 'lodash/isEqual';
import createClient from './createClient';

export default function useGraphQLProvider(options) {
  const [user, setUser] = useState();
  const ref = useRef();

  if (ref.current === undefined || isEqual(options, ref.current.options) === false) {
    const client = createClient(options, setUser);
    ref.current = { options, client };
  }

  return [ref.current.client, user];
}
