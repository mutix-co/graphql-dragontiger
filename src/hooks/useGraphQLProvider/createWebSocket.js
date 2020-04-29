import { SubscriptionClient } from 'subscriptions-transport-ws';

export default function createWebSocket({ configs }) {
  if (configs.ws === undefined) return null;
  const subscriptionClient = new SubscriptionClient(
    configs.ws,
    {
      reconnect: true,
      connectionParams: () => ({}),
    },
  );

  return subscriptionClient;
}
