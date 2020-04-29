```js
import { useState, useReducer, useCallback } from 'react';
import QueryBoundary from './QueryBoundary';

function Component() {
  const [count, increment] = useReducer(i => i + 1, 0);
  const [status, setStatus] = useState();

  const onLoadSucceedClick = useCallback(() => {
    setStatus(
      new Promise(() => {
        setTimeout(
          () => {
            increment();
            setStatus(null);
          },
          2000,
        );
      }),
    );
  }, [setStatus]);

  const onLoadFailedClick = useCallback(() => {
    setStatus(
      new Promise(() => {
        setTimeout(
          () => setStatus(new Error('query error')),
          2000,
        );
      }),
    );
  }, [setStatus]);

  if (status instanceof Promise || status instanceof Error) throw status;

  return (
    <div>
      <div data-testid="count">{`Count: ${count}`}</div>
      <button data-testid="succeed" onClick={onLoadSucceedClick}>ReLoad Succeed</button>
      <button data-testid="failed" onClick={onLoadFailedClick}>ReLoad Failed</button>
    </div>
  );
}

function Spinner() {
  return <div>loading...</div>;
}

function ErrorMessage({ error, onRetry }) {
  return (
    <>
      <div>Error!! {error.message}</div>
      <button data-testid="retry" onClick={onRetry}>Retry</button>
    </>
  );
}

<QueryBoundary fallback={Spinner} errorback={ErrorMessage}>
  <Component />
</QueryBoundary>
```