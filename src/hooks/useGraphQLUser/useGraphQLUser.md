```js
import { useCallback, Suspense } from 'react';
import useGraphQLUser from './useGraphQLUser';

function User() {
  const user = useGraphQLUser();
  const onSignIn = useCallback(() => {}, [user]);
  const onSignOut = useCallback(() => {}, [user]);
  const onReview = useCallback(() => {}, [user]);

  return (
    <>
      <button onClick={onSignIn}>SignIn</button>
      <button onClick={onSignOut}>SingOut</button>
      <button onClick={onReview}>Review</button>
    </>
  )
}

<Suspense fallback="waiting...">
  <User />
</Suspense>
```