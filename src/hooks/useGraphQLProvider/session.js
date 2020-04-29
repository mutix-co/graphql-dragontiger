import window from 'global/window';

function session() {
  const map = new Map();
  map.setItem = map.set;
  map.getItem = map.get;
  map.removeItem = map.delete;
  return map;
}

export default window.sessionStorage || session();
