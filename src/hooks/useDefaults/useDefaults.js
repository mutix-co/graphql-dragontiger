import { useRef } from 'react';
import defaults from 'lodash/defaults';
import isEqual from 'lodash/isEqual';

export default function useDefaults(...args) {
  const ref = useRef({});
  if (isEqual(ref.current.args, args) === false) {
    ref.current.args = args;
    ref.current.value = defaults({}, ...args);
  }
  return ref.current.value;
}
