### With Query Tag
```js
import gql from 'graphql-tag';
import { useCallback } from 'react';
import useNode from './useNode';
import useMutation from '../useMutation';
import { QueryBoundary } from '../../client';

const query = gql`query($id: ID!) { node(id: $id) { id ... on Tag { value } } }`;
const mutation = gql`mutation($input: UpdateTagInput) { updateTag(input: $input) { status tag { id value } } }`;

function useCatch() {
  throw new Error('is error');
}

function Node() {
  const [tag, { suspender }] = useNode('TAG_01', { query });

  if (suspender !== null) throw suspender;

  return <div>{tag.id}: {tag.value}</div>
}

function Mutation() {
  const [mutate] = useMutation(mutation);
  const onClick = useCallback(() => {

  }, [mutate])
  return <button onClick={onClick}>submit</button>
}

<div data-testid="useNode-with-query-example">
  <QueryBoundary>
    <Node />
  </QueryBoundary>
  <Mutation />
</div>
```

### Without Query Tag
```js
import gql from 'graphql-tag';
import { useCallback } from 'react';
import useNode from './useNode';
import useMutation from '../useMutation';
import { QueryBoundary } from '../../client';

const query = gql`query { tags(id: $id) { id value } }`;

function Node({ id }) {
  const node = useNode(id);
  return <div>{node.id}: {node.value}</div>
}

<>
  <QueryBoundary>
    <Node id="TAG_01" />
  </QueryBoundary>
  <QueryBoundary>
    <Node id="TAG_02" />
  </QueryBoundary>
</>
```