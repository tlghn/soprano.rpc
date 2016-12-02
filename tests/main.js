/**
 * Created by tolgahan on 16.11.2016.
 */
"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should;

const Soprano = require('soprano');
const RPCProtocol = require('../');



it('Simple Call', function (done) {
    const soprano = new Soprano();
    const rpcProtocol = new RPCProtocol(soprano);

    rpcProtocol.map.mul(function (a, b) {
        return a * b;
    });
    const executor = rpcProtocol.executor;

    (async function () {
        await soprano.bind(rpcProtocol);
        let server = await soprano.listen();
        try{
            let result = await executor.mul(3, 2);
            expect(result).to.equal(6);
            done();
        } finally {
            server.dispose();
            rpcProtocol.dispose();
            soprano.dispose();
        }
    })();
});

it('Error Handling', function (done) {
    const soprano = new Soprano();
    const rpcProtocol = new RPCProtocol(soprano);

    rpcProtocol.map.throwSomeError(function () {
        throw new Error('AN ERROR');
    });
    const executor = rpcProtocol.executor;

    (async function () {
        await soprano.bind(rpcProtocol);
        let server = await soprano.listen();
        try{
            await executor.throwSomeError();
        } catch (err) {
            expect(err.message).to.equal('AN ERROR');
            done();
        } finally {
            server.dispose();
            rpcProtocol.dispose();
            soprano.dispose();
        }
    })();
});

it('Middlewares', function (done) {
    const soprano = new Soprano();
    const rpcProtocol = new RPCProtocol(soprano);
    rpcProtocol.use(function(obj, req) {
        if(req){
            req.auth = obj.auth;
        } else {
            obj.auth = 'test';
        }
        return obj;
    });

    rpcProtocol.map.getAuth(function(req) {
        return req.auth;
    });
    const executor = rpcProtocol.executor;

    (async function () {
        await soprano.bind(rpcProtocol);
        let server = await soprano.listen();
        try{
            let auth = await executor.getAuth();
            expect(auth).to.equals('test');
            done();
        } finally {
            server.dispose();
            rpcProtocol.dispose();
            soprano.dispose();
        }
    })();
});

it('Middleware Error Handling', function (done) {
    const soprano = new Soprano();
    const rpcProtocol = new RPCProtocol(soprano);
    rpcProtocol.use(function(obj, req) {
        if(req){
            if(req.auth !== 'test'){
                throw new TypeError('Invalid Auth');
            }
        } else {
            obj.auth = 'wrong auth';
        }
        return obj;
    });

    rpcProtocol.map.add(function(a, b, req) {
        return a + b;
    });
    const executor = rpcProtocol.executor;

    (async function () {
        await soprano.bind(rpcProtocol);
        let server = await soprano.listen();
        try{
            let total = await executor.add(1, 2);
        } catch (err) {
            assert(err instanceof TypeError);
            expect(err.message).to.equal('Invalid Auth');
            done();
        } finally {
            server.dispose();
            rpcProtocol.dispose();
            soprano.dispose();
        }
    })();
});

it('Stream Filters', function (done) {
    const TestFilterFactory = require('./TestFilterFactory');
    const soprano = new Soprano();
    const rpcProtocol = new RPCProtocol(soprano);

    rpcProtocol.filterFactory = new TestFilterFactory();

    rpcProtocol.map.mul(function (a, b) {
        return a * b;
    });
    const executor = rpcProtocol.executor;

    (async function () {
        await soprano.bind(rpcProtocol);
        let server = await soprano.listen();
        try{
            let result = await executor.mul(3, 2);
            expect(result).to.equal(6);
            done();
        } finally {
            server.dispose();
            rpcProtocol.dispose();
            soprano.dispose();
        }
    })();
});