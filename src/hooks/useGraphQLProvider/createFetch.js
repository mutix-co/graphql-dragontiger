import axios from 'axios';
import { JSONWebSecretBox, TextArray } from 'jw25519';

export default function createFetch(options) {
  const { configs } = options;
  const request = configs.fetch || axios;

  const debounce = new Map();

  const handler = async (params) => {
    let response;
    if (params.serverKey && params.data) {
      const jwsb = JSONWebSecretBox();
      const ciphertext = jwsb.encrypt(
        TextArray.convertStringToUTF16(JSON.stringify(params.data)),
        configs.serverKey,
      );
      const tmp = await request({
        ...params,
        data: { ciphertext, key: jwsb.keyPair.publicKey },
      });
      const { data } = tmp;
      response = { ...tmp, data: jwsb.decrypt(data.ciphertext, data.key) };
    } else {
      response = await request(params);
    }
    return response;
  };

  const fetch = (params) => {
    const { hash } = params;
    if (hash !== undefined) {
      if (debounce.has(hash) === false) {
        debounce.set(hash, []);
        setTimeout(
          async () => {
            const hits = debounce.get(hash);
            debounce.delete(hash);
            try {
              const response = await handler(params);
              hits.forEach(({ resolve }) => resolve(response));
            } catch (error) {
              hits.forEach(({ reject }) => reject(error));
            }
          },
          10,
        );
      }

      const hits = debounce.get(hash);
      const promise = new Promise((resolve, reject) => {
        hits.push({ resolve, reject });
      });
      return promise;
    }

    return handler(params);
  };

  return fetch;
}
