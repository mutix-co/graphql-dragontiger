### Sample Code
```js static
function Component() {
  const [mutate, { error, state, resetState }] = useMutation(GRAPHQL_TAG, { autoReset });

  return (
    <Button state={state} onClick={() => mutate(input)} />
  );
}
```

```jsx
import { useCallback, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import gql from 'graphql-tag';
import useMutation from './useMutation';

const spinFrames = keyframes`
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(1080deg); }
`;

const doneFrames = keyframes`
  from { transform: translate(-50%, -13px) rotate(0) scale(0); }
  to { transform: translate(-50%, -13px) rotate(-45deg) scale(1); }
`;

const errorFrames = keyframes`
  from { transform: translate(-50%, -50%) scale(0); }
  to {  transform: translate(-50%, -50%) scale(1); background-color: #f44336; }
`;

const vibrateFrames = keyframes`
  0%, 30%, 60%, 85%, 100% { 
    left: 0;
    background-color: #f44336;
  }
  10%, 40%, 90%, 70% { 
    left: -2px;
    background-color: #f44336;
  }
  20%, 50%, 80%, 95% { 
    left: 2px;
    background-color: #f44336;
  }
`;

const Wrapper = styled.div`
  display: flex;

  & > div {
    margin-right: 20px;
  }
`;

const Box = styled.div`
  width: 90px;
`;

const Button = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 90px;
  height: 42px;
  background: #8BC34A;
  color: #fefefe;
  border-radius: 4px;
  position: relative;
  cursor: pointer;
  appearance: none;
  border: 0;
  margin: 0 auto;
  transition: width .3s ease-in .05s, border-radius .3s ease-in .05s, color .3s ease-in .05s;
  
  &:focus {
    outline: 0;
  }

  &:after {
    content: '';
    border: 0;
    transition: border .3s ease-in .05s;
  }

  ${({ state }) => state === 'processing' && css`
    width: 42px;
    height: 42px;
    border-radius: 50%;
    color: transparent;
  `}

  ${({ state }) => state === 'processing' && css`
    &:after {
      position: absolute;
      content: '';
      width: 25px;
      height: 25px;
      border: 4px solid #fefefe;
      border-radius: 50%;
      border-left-color: transparent;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      animation-name: ${spinFrames};
      animation-iteration-count: infinite;
      animation-timing-function: linear;
      animation-duration: 2.5s;
      animation-delay: .3s;
      animation-fill-mode: forwards;
    }
  `}

  ${({ state }) => state === 'finish' && css`
    color: transparent;

    &:before {
      position: absolute;
      content: '';
      width: 25px;
      height: 12.5px;
      border: 4px solid #fefefe;
      border-right: 0;
      border-top: 0;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -13px) rotate(0deg) scale(0);
      animation: ${doneFrames} ease-in 0.15s forwards;
    }
  `}

  ${({ state }) => state === 'failed' && css`
    position: relative;
    color: transparent;
    animation: ${vibrateFrames} ease-in 0.5s forwards;
    animation-delay: .3s;
  
    &:before {
      color: #fff;
      position: absolute;
      content: '!';
      font-size: 1.8rem;
      font-weight: bold;
      text-align: center;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) scale(0);
      animation: ${errorFrames} ease-in 0.5s forwards;
      animation-delay: .3s;
    }
  `}
`;

const SET_BOOKSHELF = gql`
  mutation ($input: SetBookshelfInput!) {
    setBookshelf (input: $input) { status bookshelf { id title usage } }
  }
`;

function Component({ input, autoReset, children }) {
  const [setBookshelf, { error, state, resetState }] = useMutation(SET_BOOKSHELF, { autoReset });
  const [mark, setMark] = useState(0);

  const onClick = useCallback(async () => {
    if (state === 'pending') return;
    else if (state === 'failed' || state === 'finish') {
      resetState();
      return;
    }
    try {
      const timestamp = Date.now();
      await setBookshelf(input);
      setMark(Date.now() - timestamp);
    } catch (err) {
      // empty
    }
  }, [state, setBookshelf, resetState]);

  return (
    <Box data-testid="component">
      <div data-testid="mark">{mark}</div>
      <div data-testid="state">{state}</div>
      <div data-testid="error">{error && error.stacks[0].code}</div>
      <Button data-testid="button" state={state} onClick={onClick}>
        {children}
      </Button>
    </Box>
  );
}

<Wrapper>
  <Component autoReset={2000}>Submit</Component>
  <Component input={{ pending: 3000 }}>Pending</Component>
  <Component input={{ pending: 0 }}>Error</Component>
</Wrapper>
```