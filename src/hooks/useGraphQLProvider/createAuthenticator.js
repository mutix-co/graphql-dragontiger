import debounce from '../../utils/debounce';
import NetworkError from '../../utils/NetworkError';

export default function createAuthenticator(client) {
  const {
    configs, storage, fetch, serverKey,
  } = client;

  const self = {
    getCorrelationId() {
      return storage.getItem('dragontiger-correlation-id') || '';
    },
    setCorrelationId(value) {
      storage.setItem('dragontiger-correlation-id', value);
    },
    getAccess() {
      const expired = storage.getItem('dragontiger-expired');
      if (expired < Date.now()) return '';

      const value = storage.getItem('dragontiger-access-token');
      if (value) return `Bearer ${value}`;
      return '';
    },
    setAccess(value) {
      storage.setItem('dragontiger-access-token', value);
      storage.setItem('dragontiger-expired', Date.now() + 55 * 60 * 1000);
    },
    getRefresh() {
      return storage.getItem('dragontiger-refresh-token') || '';
    },
    setRefresh(value) {
      storage.setItem('dragontiger-refresh-token', value);
    },
    async signIn(params) {
      await serverKey.check();
      const result = await fetch({
        method: 'POST', url: configs.authorization, action: 'signIn', ...params,
      });
      return result;
    },
    async signOut(params) {
      try {
        await serverKey.check();
        const result = await fetch({
          method: 'POST', url: configs.authorization, action: 'signOut', ...params,
        });
        return result;
      } finally {
        self.setAccess('');
        self.setRefresh('');
      }
    },
    async renew(params) {
      const refresh = self.getRefresh();
      if (refresh === '') throw new Error('refreshToken is null');

      await serverKey.check();
      try {
        const result = await fetch({
          method: 'POST', url: configs.authorization, action: 'renew', refreshToken: refresh, ...params,
        });
        self.setAccess(result.accessToken);
        self.setRefresh(result.refreshToken);
        return result;
      } catch (error) {
        if (NetworkError.isForbidden(error)) {
          self.setAccess('');
          self.setRefresh('');
        }
        throw error;
      }
    },
    check: debounce(async () => {
      if (self.getAccess() === '' && self.getRefresh() !== '') await self.renew();
    }),
  };

  return self;
}
