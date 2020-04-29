```js static
/**
 * @param {GraphQL} tag
 * @param {Object} variables
 * @param {Object} params
 * @param {boolean} params.ignoreErrors
 */
```

```jsx
import React, { Suspense } from 'react';
import gql from 'graphql-tag';
import { QueryBoundary } from '../../client';
import useQuery from "./";

const QUERY_TAGS = gql`query { tags { id value } }`;

function Component() {
  const [data] = useQuery(QUERY_TAGS);
  return (
    <>
      {_.map(data, ({ id, value }) => <div key={id}>{value}</div>)}
    </>
  );
}

<Suspense fallback={<div>loading</div>}>
  <Component />
</Suspense>
```