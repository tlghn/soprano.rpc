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

```
const Soprano = require('soprano');
const RPCProtocol = require('soprano.rpc');

const soprano = new Soprano();
const rpcProtocol = new RPCProtocol(soprano);
const rpcMap = rpcProtocol.map;

rpcMap.add(function *(a, b, req) {
    yield a + b;
}).sub(function *(a, b, req) {
    yield a - b;
}).mul(function *(a, b, req) {
    yield a * b;
}).div(function *(a, b, req) {
    yield a / b;
});

Soprano.run(function *() {
    yield soprano.bind(rpcProtocol);
    let server = yield soprano.listen();
});


```


client.js 

```
const Soprano = require('soprano');
const RPCProtocol = require('soprano.rpc');

Soprano.run(function *() {
    const soprano = new Soprano();
    const rpcProtocol = new RPCProtocol(soprano);
    const rpc = rpcProtocol.executor;
    
    yield soprano.bind(rpcProtocol);

    console.log(yield rpc.add(10, 5));
    // output: 15
    console.log(yield rpc.sub(10, 5));
    // output: 5
    console.log(yield rpc.mul(10, 5));
    // output: 50
    console.log(yield rpc.div(10, 5));
    // output: 2
    
    // dispose all resources if you dont plan to re-use them
    rpcProtocol.dispose();
    soprano.dispose();
});


```



### Error Handling

server.js 

```
const Soprano = require('soprano');
const RPCProtocol = require('soprano.rpc');

const soprano = new Soprano();
const rpcProtocol = new RPCProtocol(soprano);
const rpcMap = rpcProtocol.map;

rpcMap.throwSomeError(function *() {
    throw new Error('Hey I am en error and I wont stop server but I will be thrown on client side!');
});

Soprano.run(function *() {
    yield soprano.bind(rpcProtocol);
    let server = yield soprano.listen();
});


```


client.js 

```
const Soprano = require('soprano');
const RPCProtocol = require('soprano.rpc');

Soprano.run(function *() {
    const soprano = new Soprano();
    const rpcProtocol = new RPCProtocol(soprano);
    const rpc = rpcProtocol.executor;
    yield soprano.bind(rpcProtocol);
    
    
    try{
        yield rpc.throwSomeError();
    }catch(err){
        console.log('Here is the server error');
        console.error(err);
    }
    
    // dispose all resources if you dont plan to re-use them
    rpcProtocol.dispose();
    soprano.dispose();
});


```



### Middlewares

server.js 

```
const Soprano = require('soprano');
const RPCProtocol = require('soprano.rpc');

const soprano = new Soprano();
const rpcProtocol = new RPCProtocol(soprano);

rpcProtocol.use(function *(obj, req){
    switch(obj.name){
        case 'somePrivateMethod':
            req.user = someCoolMethodToFindUserWithAuth(obj.auth);
            if(!req.user) {
                throw new Error('Unauthorized');
            }
            break;
    }
    yield obj;
});

const rpcMap = rpcProtocol.map;

rpcMap.somePrivateMethod(function *(req) {
    yield 'Hello ' + req.user.name;
});

rpcMap.somePublicMethod(function *(req) {
    yield 'Hello anonymous user!';
});

Soprano.run(function *() {
    yield soprano.bind(rpcProtocol);
    let server = yield soprano.listen();
});


```


client.js 

```
const Soprano = require('soprano');
const RPCProtocol = require('soprano.rpc');

const soprano = new Soprano();
const rpcProtocol = new RPCProtocol(soprano);

rpcProtocol.use(function *(obj){
    if(obj.name === 'somePrivateMethod') {
        obj.auth = 'Some auth key';
    }
    yield obj;
});


Soprano.run(function *() {
    const rpc = rpcProtocol.executor;
    yield soprano.bind(rpcProtocol);
    
    
    try{
        console.log(yield rpc.somePublicMethod());
        console.log(yield rpc.somePrivateMethod());
    }catch(err){
        console.log('Here is the server error');
        console.error(err);
    }
});


```


### Stream Filters

By using stream filters (it is cool feature of soprano) You can encrypt/decrypt and/or compress/decompress your data during transfer.


TestFilterFactory.js
```
"use strict";

const zlib = require('zlib');
const crypto = require('crypto');

const FilterFactory = require('soprano').FilterFactory;


class TestFilterFactory extends FilterFactory {

    *createInputFilter(){
        yield [
            zlib.createGunzip(),
            crypto.createDecipher('aes-192-ctr', '123456')
        ];
    }

    *createOutputFilter(){
        yield [
            crypto.createCipher('aes-192-ctr', '123456'),
            zlib.createGzip()
        ];
    }
}

module.exports = TestFilterFactory;
```


server.js 

```
const Soprano = require('soprano');
const RPCProtocol = require('soprano.rpc');
const TestFilterFactory = require('./TestFilterFactory');

const soprano = new Soprano();
const rpcProtocol = new RPCProtocol(soprano);
rpcProtocol.filterFactory = new TestFilterFactory();


const rpcMap = rpcProtocol.map;

rpcMap.add(function *(a, b) {
    yield a + b;
}).sub(function *(a, b) {
    yield a - b;
}).mul(function *(a, b) {
    yield a * b;
}).div(function *(a, b) {
    yield a / b;
});

Soprano.run(function *() {
    yield soprano.bind(rpcProtocol);
    let server = yield soprano.listen();
});


```


client.js 

```
const Soprano = require('soprano');
const RPCProtocol = require('soprano.rpc');
const TestFilterFactory = require('./TestFilterFactory');

Soprano.run(function *() {
    const soprano = new Soprano();
    const rpcProtocol = new RPCProtocol(soprano);
    rpcProtocol.filterFactory = new TestFilterFactory();
    
    const rpc = rpcProtocol.executor;
    
    yield soprano.bind(rpcProtocol);

    console.log(yield rpc.add(10, 5));
    // output: 15
    console.log(yield rpc.sub(10, 5));
    // output: 5
    console.log(yield rpc.mul(10, 5));
    // output: 50
    console.log(yield rpc.div(10, 5));
    // output: 2
    
    // dispose all resources if you dont plan to re-use them
    rpcProtocol.dispose();
    soprano.dispose();
});


```



### More Examples ?
Please see the tests directory