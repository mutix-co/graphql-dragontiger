import axios from 'axios';
import NetworkError from '../../utils/NetworkError';

export default function createFetch(client) {
  const { configs } = client;
  const request = configs.fetch || axios;

  return async (params) => {
    try {
      return await request(params);
    } catch (error) {
      if (error.response !== undefined) {
        throw error;
      } else if (error.message === 'Network Error') {
        throw new NetworkError();
      }

      throw error;
    }
  };
}
