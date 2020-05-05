主要用於集合 (Collection) 或清單 (List) 下方的 Component，只需傳入 Global Id 參數 (props) 即可取得整個 Node

### Features

- 當 `params.query` is undefined 時，會等待或使用其他 Component query 的結果
- `throw suspense;` 可進入 [Suspense](https://zh-hant.reactjs.org/docs/concurrent-mode-suspense.html) Promise 程序

### Sample Code
```js static
function Sample({ id, query }) {
  const [node, { suspense }] = useNode(id, params);
  return <div>{node.id}: {node.value}</div>
}
```

### Update From Mutation
```js { "file": "../useNode.js" }
import gql from 'graphql-tag';
import { useState, useCallback } from 'react';
import useNode from './useNode';
import useMutation from '../useMutation';
import { QueryBoundary } from '../../client';

const query = gql`query($id: ID!) { node(id: $id) { id ... on Tag { value } } }`;
const mutation = gql`mutation($input: UpdateTagInput!) { updateTag(input: $input) { status tag { id value } } }`;

function Node() {
  const [tag, { suspense }] = useNode('TAG_01', { query });
  if (suspense !== null) throw suspense;
  return <div>{tag.id}: {tag.value}</div>
}

function Mutation() {
  const [mutate] = useMutation(mutation);
  const [value, setValue] = useState('');
  const onChange = useCallback((e) => setValue(e.target.value));
  const onClick = useCallback(() => mutate({ id: 'TAG_01', value }), [mutate, value]);
  return (
    <>
      <input type="text" value={value} onChange={onChange} />
      <button onClick={onClick}>Update</button>
    </>
  );
}

<div data-testid="useNode-update-from-mutation-example">
  <fieldset data-testid="query">
    <legend>Query Node:</legend>
    <QueryBoundary>
      <Node />
    </QueryBoundary>
  </fieldset>
  <fieldset data-testid="mutation">
    <legend>Mutation Node:</legend>
      <Mutation />
  </fieldset>
</div>
```

### Update From Query
```js
import gql from 'graphql-tag';
import { useCallback } from 'react';
import useNode from './useNode';
import useMutation from '../useMutation';
import useGraphQLClient from '../useGraphQLClient';
import { QueryBoundary } from '../../client';

const node = gql`query($id: ID!) { node(id: $id) { id ... on Tag { value } } }`;
const query = gql`query { tags { id value } }`;

function Node({ id, query }) {
  const [node, { suspense }] = useNode(id, { query });
  if (suspense !== null) throw suspense;
  return <div>{node.id}: {node.value}</div>
}

function Queries() {
  const client = useGraphQLClient();
  const onClick = useCallback(() => client.query(query), [client]);
  return <button onClick={onClick}>Fetch From Tags</button>
}

<div data-testid="useNode-update-from-query-example">
  <fieldset data-testid="TAG_01">
    <legend>TAG_01:</legend>
    <QueryBoundary>
      <Node id="TAG_01" query={node} />
    </QueryBoundary>
  </fieldset>
  <fieldset data-testid="TAG_02">
    <legend>TAG_02:</legend>
    <QueryBoundary>
      <Node id="TAG_02" />
    </QueryBoundary>
  </fieldset>
  <fieldset data-testid="fetch">
    <legend>TAG_01:</legend>
    <Queries />
  </fieldset>
</div>
```