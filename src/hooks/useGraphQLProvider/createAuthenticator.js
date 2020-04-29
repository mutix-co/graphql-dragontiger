import get from 'lodash/get';
import axios from 'axios';

function isForbidden(e) {
  return get(e, ['response', 'status']) === 403;
}

export default function createAuthenticator(options) {
  const { configs, token, fetch } = options;

  return {
    async signIn(params) {
      const result = await fetch({ method: 'signIn', ...params });
      return result;
    },
    async signOut(params) {
      try {
        const result = await fetch({ method: 'signOut', ...params });
        return result;
      } finally {
        token.setAccess('');
        token.setRefresh('');
      }
    },
    async renew(params) {
      const { refresh } = token;
      if (refresh === '') throw new Error('refreshToken is null');

      try {
        const result = await fetch({ method: 'renew', refreshToken: refresh, ...params });
        token.setAccess(result.accessToken);
        token.setRefresh(result.refreshToken);
        return result;
      } catch (error) {
        token.setAccess('');
        token.setRefresh('');
        throw error;
      }
    },
  };
}
