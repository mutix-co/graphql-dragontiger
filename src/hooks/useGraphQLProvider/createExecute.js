import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import isPlainObject from 'lodash/isPlainObject';
import isArray from 'lodash/isArray';
import GraphQLError from '../../utils/GraphQLError';

export default function createExecute(client) {
  const {
    configs, fetch, cache, listeners, serverKey, authenticator,
  } = client;

  const findNode = (data) => {
    if (isPlainObject(data)) {
      const tmp = mapValues(data, findNode);
      if (tmp.id) {
        const result = cache.merge(`NODE:${tmp.id}`, tmp);
        listeners.emit(`NODE:${tmp.id}`, result);
        return result;
      }
      return tmp;
    }
    if (isArray(data)) return map(data, findNode);
    return data;
  };

  return async (params) => {
    const { hash } = params;

    try {
      await serverKey.check();
      await authenticator.check();

      const headers = {
        'X-Correlation-Id': authenticator.getCorrelationId(),
        Authorization: authenticator.getAccess(),
        ...params.headers,
      };

      const cryptor = serverKey.getCryptor();
      const response = await fetch({
        method: 'POST',
        url: configs.graphql,
        ...params,
        headers,
        data: cryptor.encrypt(params.data),
        transformResponse: [(d) => {
          const data = JSON.parse(d);
          return cryptor.decrypt(data.ciphertext, data.serverKey);
        }],
      });

      const { data, errors } = response.data;
      if (errors !== undefined) throw new GraphQLError(errors);

      const result = findNode(data);
      if (hash !== undefined) {
        cache.set(hash, result);
        listeners.emit(hash, result);
      }
      return result;
    } catch (error) {
      configs.errorHander(error);

      cache.set(hash, error);
      listeners.emit(hash, error);

      throw error;
    }
  };
}
