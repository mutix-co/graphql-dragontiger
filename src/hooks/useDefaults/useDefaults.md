
### Sample Code
```js static
function Sample() {
  const data = useDefaults(defaults, options);
  return <div data={data} />;
}
```

```js
import { useReducer } from 'react';
import useDefaults from './useDefaults';
import Example from 'examples/Example';
import Value from 'examples/Value';

let previous;
function Wrapper() {
  const [times, forceUpdate] = useReducer(i => i + 1, 0);
  const [state, dispatch] = useReducer((value, offset) => (value += offset), 1);
  const result = useDefaults({ name: 'dragontiger' }, { state });

  const isSame = previous === result;
  previous = result;
  return (
    <Example name="useDefaults">
      <Value name="isSame">{`${isSame === true ? 'yes' : 'no'} ${times}`}</Value>
      <Value name="Value">{state}</Value>
      <button name="increment" onClick={() => { dispatch(1); forceUpdate(); }}>+1</button>
      <button name="no-change" onClick={() => { dispatch(0); forceUpdate(); }}>+0</button>
    </Example>
  )
}

<Wrapper />
```