```js
import { useState, useCallback } from 'react';
import { authenticator } from 'otplib';
import Example from 'examples/Example';

const secret = authenticator.generateSecret();

function Wrapper() {
  const [token, setToken] = useState('');

  const onCheck = useCallback(() => {
    alert(authenticator.check(token, secret));
    setToken('');
  }, [token]);

  return (
    <Example name="TOTPQRCode">
      <TOTPQRCode service="dragontiger" user="demo" secret={secret} />
      <input value={token} onChange={(e) => setToken(e.target.value)} />
      <button onClick={onCheck}>check</button>
    </Example>
  )
}

<Wrapper />
```