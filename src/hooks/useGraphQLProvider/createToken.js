export default function createToken({ storage }) {
  return {
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
  };
}
