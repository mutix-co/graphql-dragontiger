### Sample Code
```js static
function Sample() {
  const [data, { error, refresh, suspense }] = useQuery(GRAPHQL_TAG, variables, params);
  return <div>{data}</div>
}
```

```jsx
import React, { Suspense } from 'react';
import gql from 'graphql-tag';
import { QueryBoundary } from '../../client';
import useQuery from "./";

const QUERY_TAGS = gql`query { tags { id value } }`;

function Component() {
  const [data, { suspense }] = useQuery(QUERY_TAGS);

  if (suspense) throw suspense;

  return (
    <>
      {_.map(data, ({ id, value }) => <div key={id}>{value}</div>)}
    </>
  );
}

<Suspense>
  <Component />
</Suspense>
```