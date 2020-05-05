### Sample Code
```js static
function Sample({ id, query }) {
  const [client, user] = useGraphQLProvider(options);
  return (
    <GraphQLProvider client={client} user={user}>
      <Component />
    </GraphQLProvider>
  )
}
```