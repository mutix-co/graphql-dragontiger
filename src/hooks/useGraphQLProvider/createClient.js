import defaults from 'lodash/defaults';
import identity from 'lodash/identity';
import { print } from 'graphql/language/printer';
import defaultStorage from './storage';
import defaultSession from './session';
import createAuthenticator from './createAuthenticator';
import createCache from './createCache';
import createExecute from './createExecute';
import createFetch from './createFetch';
import createGraphQL from './createGraphQL';
import createListeners from './createListeners';
import createToken from './createToken';
import createWebSocket from './createWebSocket';

export default function createClient(options) {
  const configs = defaults({}, options, {
    graphql: '/graphql',
    errorHander: identity,
  });

  const service = {};

  service.session = configs.session || defaultSession;
  service.storage = configs.storage || defaultStorage;
  service.cache = configs.cache || createCache({ configs, ...service });
  service.token = configs.token || createToken({ configs, ...service });

  // set() {
  //   window.addEventListener('blur', pause);
  //   window.addEventListener('focus', play);
  // }

  service.listeners = createListeners({ configs, ...service });
  service.fetch = createFetch({ configs, ...service });
  service.authenticator = createAuthenticator({ configs, ...service });
  service.execute = createExecute({ configs, ...service });
  service.webSocket = createWebSocket({ configs, ...service });
  service.graphql = createGraphQL({ configs, ...service });

  return {
    resetStore() {
      service.session.clear();
      service.storage.clear();
    },
    print,
    ...service,
    ...service.graphql,
    ...service.authenticator,
  };
}
