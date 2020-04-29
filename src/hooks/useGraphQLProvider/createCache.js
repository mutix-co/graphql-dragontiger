function isNull(value) {
  return value === undefined || value === null;
}

export default function createCache({ session }) {
  return {
    get(name) {
      const result = session.getItem(`dragontiger-${name}`);
      if (isNull(result) === true) return null;
      const { value } = JSON.parse(result);
      return value;
    },
    set(name, value) {
      const timestamp = Date.now() + 5000;
      session.setItem(`dragontiger-${name}`, JSON.stringify({ value, timestamp }));
    },
    has(name) {
      return isNull(session.getItem(`dragontiger-${name}`)) === false;
    },
    expired(name) {
      const result = session.getItem(`dragontiger-${name}`);
      if (isNull(result) === true) return true;
      const { timestamp } = JSON.parse(result);
      return timestamp < Date.now();
    },
  };
}
