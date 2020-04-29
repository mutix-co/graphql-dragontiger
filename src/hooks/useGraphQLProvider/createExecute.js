import GraphQLError from '../../utils/GraphQLError';

export default function createExecute({
  configs, fetch, token, authenticator,
}) {
  // cache.set(hash, response.data);
  // listeners.emit(hash, response.data);
  // listeners.emit(hash, error);

  const link = {
    hits: null,
    renew() {
      if (link.hits === null) {
        link.hits = [];
        setTimeout(
          async () => {
            const { hits } = link;
            link.hits = null;
            try {
              await authenticator.renew();
              hits.forEach(({ resolve }) => resolve());
            } catch (error) {
              hits.forEach(({ reject }) => reject(error));
            }
          },
          10,
        );
      }
      return new Promise((resolve, reject) => {
        link.hits.push({ resolve, reject });
      });
    },
  };

  return async (params) => {
    if (token.getAccess() === '' && token.getRefresh() !== '') await link.renew();

    const headers = {
      'X-Correlation-Id': token.getCorrelationId(),
      Authorization: token.getAccess(),
      ...params.headers,
    };
    const response = await fetch({
      method: 'POST', url: configs.graphql, ...params, headers,
    });
    const errors = response.data && response.data.errors;
    if (errors) throw new GraphQLError(errors);
    return response;
  };
}
