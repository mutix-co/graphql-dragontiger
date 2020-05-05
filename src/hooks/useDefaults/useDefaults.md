
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

let previous;
function Component() {
  const [times, forceUpdate] = useReducer(i => i + 1, 0);
  const [state, dispatch] = useReducer((value, offset) => (value += offset), 1);
  const result = useDefaults({ name: 'dragontiger' }, { state });

  const isSame = previous === result;
  previous = result;
  return (
    <>
      <div data-testid="result" >相同物件: {isSame === true ? 'yes' : 'no'} {times}</div>
      <div data-testid="value" >Value: {state}</div>
      <button data-testid="increment" onClick={() => { dispatch(1); forceUpdate(); }}>+1</button>
      <button data-testid="no-change" onClick={() => { dispatch(0); forceUpdate(); }}>+0</button>
    </>
  )
}

<Component />
```