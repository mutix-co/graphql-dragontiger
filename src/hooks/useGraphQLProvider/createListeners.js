import window from 'global/window';

export default function createListeners({ storage, cache }) {
  const listeners = new Map();

  const fetchListener = (name) => {
    if (listeners.has(name) === false) listeners.set(name, new Map());
    return listeners.get(name);
  };

  const once = (name, handler) => {
    const listener = fetchListener(name);
    const doHandler = (...args) => {
      handler(...args);
      listener.delete(handler);
    };
    listener.set(handler, doHandler);
    return () => listener.delete(handler);
  };

  const addListener = (name, handler) => {
    const listener = fetchListener(name);
    if (cache.has(name) === true) handler(cache.get(name));
    listener.set(handler, handler);
    return () => listener.delete(handler);
  };

  const removeListener = (name, handler) => {
    const listener = fetchListener(name);
    listener.delete(handler);
    return this;
  };

  const removeAllListeners = (name) => {
    const listener = fetchListener(name);
    listener.clear();
    return this;
  };

  const clear = () => {
    listeners.forEach((listener) => listener.clear());
    return this;
  };

  const emit = (name, ...args) => {
    const listener = fetchListener(name);
    storage.setItem('dragontiger-listener', { name, args, timestamp: Date.now() });
    listener.forEach((handler) => handler(...args));
    return this;
  };

  if (window.addEventListener !== undefined) {
    window.addEventListener('storage', ({ key, newValue }) => {
      if (key === 'dragontiger-listener') {
        const event = JSON.parse(newValue);
        const listener = fetchListener(event.name);
        listener.forEach((handler) => handler(...event.args));
      }
    });
  }

  return {
    once,
    addListener,
    removeListener,
    removeAllListeners,
    clear,
    emit,
  };
}
