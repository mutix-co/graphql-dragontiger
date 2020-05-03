module.exports = function debounce(handler, wait = 100) {
  let hits = null;
  return (...args) => {
    if (hits === null) {
      hits = [];
      setTimeout(
        async () => {
          const tmp = hits;
          hits = null;
          try {
            const result = await handler(...args);
            tmp.forEach(({ resolve }) => resolve(result));
          } catch (error) {
            tmp.forEach(({ reject }) => reject(error));
          }
        },
        wait,
      );
    }
    return new Promise((resolve, reject) => {
      hits.push({ resolve, reject });
    });
  };
};
