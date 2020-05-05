```js
import { useState, useCallback } from 'react';
import { authenticator } from 'otplib';

const secret = authenticator.generateSecret();

function Example() {
  const [token, setToken] = useState('');

  const onCheck = useCallback(() => {
    alert(authenticator.check(token, secret));
    setToken('');
  }, [token]);

  return (
    <div>
      <TOTPQRCode service="dragontiger" user="demo" secret={secret} />
      <input value={token} onChange={(e) => setToken(e.target.value)} />
      <button onClick={onCheck}>check</button>
    </div>
  )
}

<Example />
```