import React, { useMemo, useState } from 'react';
import identity from 'lodash/identity';
import useDefaults from '../useDefaults';
import createClient from './createClient';

export default function useGraphQLProvider(options) {
  const [user, userHander] = useState();
  const configs = useDefaults(options, {
    graphql: '/graphql',
    authorization: '/authorization',
    certificate: '/certificate',
    errorHander: identity,
    userHander,
  });

  const client = useMemo(() => createClient(configs), [configs]);

  return [client, user];

  // eslint-disable-next-line no-unreachable
  return <div />;
}
