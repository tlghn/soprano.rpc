# soprano.rpc
RPC Protocol for [soprano](https://www.npmjs.com/package/soprano)

## Install
```
npm i soprano.rpc --save
```

## Examples

### Basic

Every mapped callback on server side will take "req" parameter as last argument. A SopranoClient will be passed to that parameter on execution.

server.js 

```javascript
const Soprano = require('soprano');
const RPCProtocol = require('soprano.rpc');

const soprano = new Soprano();
const rpcProtocol = soprano.createProtocol(RPCProtocol);
const rpcMap = rpcProtocol.map;

rpcMap.add(function(a, b, req) {
    return a + b;
}).sub(function (a, b, req) {
    return a - b;
}).mul(function (a, b, req) {
    return a * b;
}).div(function (a, b, req) {
    return a / b;
}).asyncTest(async function(message, delay, req) {
  return new Promise(function(resolve) {
    setTimeout(resolve, delay, message);
  });
});

(async function () {
    await soprano.bind(rpcProtocol);
    let server = await soprano.listen();
})();


```


client.js 

```javascript
const Soprano = require('soprano');
const RPCProtocol = require('soprano.rpc');

(async function () {
    const soprano = new Soprano();
    const rpcProtocol = soprano.createProtocol(RPCProtocol);
    const rpc = rpcProtocol.executor;

    console.log(await rpc.add(10, 5));
    // output: 15
    console.log(await rpc.sub(10, 5));
    // output: 5
    console.log(await rpc.mul(10, 5));
    // output: 50
    console.log(await rpc.div(10, 5));
    // output: 2

    console.log(await rpc.asyncTest("Hello World", 1000));
    // output: Hello World (after 1000ms)
    
    // dispose all resources if you dont plan to re-use them
    rpcProtocol.dispose();
    soprano.dispose();
})();


```




### More Examples ?
Please see the tests directory