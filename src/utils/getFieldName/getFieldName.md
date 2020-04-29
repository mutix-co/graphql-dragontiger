```js
import gql from 'graphql-tag';
import getFieldName from './getFieldName';

const query = gql`query { node { id } }`;
<div>{getFieldName(query)}</div>
```