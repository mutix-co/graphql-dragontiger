import { JSONWebSecretBox, Base, Text } from 'jw25519';
import debounce from '../../utils/debounce';

const { base58 } = Base;

export default function createServerKey(client) {
  const { configs, cache, fetch } = client;
  const self = {
    getCryptor() {
      const { keyId, serverKey } = cache.get('server-key');
      const jwsb = new JSONWebSecretBox();
      return {
        encrypt(data) {
          const value = Text.convertStringToUnicode(JSON.stringify(data || {}));
          const clientKey = base58.encode(jwsb.keyPair.publicKey);
          const ciphertext = jwsb.encrypt(value, new Uint8Array(serverKey));
          return { keyId, clientKey, ciphertext };
        },
        decrypt(ciphertext, publicKey) {
          const value = jwsb.decrypt(ciphertext, base58.decode(publicKey));
          return JSON.parse(Text.convertUnicodeToString(value));
        },
      };
    },
    setServerKey(keyId, serverKey, expireAt) {
      cache.set('server-key', { keyId, serverKey }, expireAt);
    },
    async renew() {
      const { data } = await fetch({ url: configs.certificate });
      const { keyId, serverKey, expireAt } = data;
      this.setServerKey(keyId, [...base58.decode(serverKey)], new Date(expireAt).getTime());
    },
    check: debounce(async () => {
      if (cache.expired('server-key') === true) await self.renew();
    }),
  };

  return self;
}
