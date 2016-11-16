/**
 * Created by tolgahan on 16.11.2016.
 */
"use strict";

const Soprano = require('soprano');
const DisposableSet = require('soprano/core/DisposableSet');
const errors = require('soprano/core/errors');

const Input = require('./Input');
const Output = require('./Output');
const Symbols = require('soprano/core/symbols');
const calp = require('calp');
const MethodCollection = Soprano.MethodCollection;
const FilterFactory = Soprano.FilterFactory;
const NS = Symbol('rpc-ns');

const HEADER = Buffer.from('RPC');

class RPCProtocol extends Soprano.FixedHeaderRequestResponseProtocol {
    constructor(soprano, header = void 0){
        super(soprano, header || HEADER);
        this.setResource(Symbols.map, new MethodCollection());
        this.setResource(Symbols.filterFactory, new FilterFactory());
        this.setResource(Symbols.handlers, new DisposableSet(this));
    }

    createInput(){
        return new Input();
    }

    createOutput(){
        return new Output();
    }

    /***
     * @returns {MethodCollection}
     * @private
     */
    get _methods(){
        return this.getResource(Symbols.map);
    }

    get _middleWares(){
        return this.getResource(Symbols.handlers);
    }
    
    use(generatorFunc){
        if(!Soprano.isGeneratorFunction(generatorFunc)){
            throw new errors.InvalidArgumentError('generatorFunc must be GeneratorFunction');
        }


        this._middleWares.add(generatorFunc);
    }

    *execute(name){
        var args = Array.prototype.slice.call(arguments, 1);
        let obj = {name, args};

        for(var mw of this._middleWares){
            obj = yield mw(obj);
        }

        let result = yield this._execute(obj);

        if(result && result.error){
            var err = result.error;
            var error = errors[err.name] || global[err.name];
            if(typeof error !== 'function'){
                error = Error;
            }

            error = new error();
            Object.keys(err).forEach(key => error[key] = err[key]);

            throw error;
        }

        yield result;
    }

    *handle(data, connection){
        yield Soprano.captureErrors;
        try{
            for(var mw of this._middleWares){
                data = yield mw(data, connection);
            }

            if(!Array.isArray(data.args)){
                data.args = [data.args, connection];
            } else {
                data.args.push(connection);
            }

            yield this._methods.execute(data.name, data.args);
        } catch (err) {
            yield {error: Object.assign({name: err.name, message: err.message}, err)};
        }
    }

    /**
     * @returns {FilterFactory}
     */
    get filterFactory(){
        return this.getResource(Symbols.filterFactory);
    }

    set filterFactory(/*FilterFactory*/value){
        this.setResource(Symbols.filterFactory, value, true);
    }

    *createInputFilter(){
        let {filterFactory} = this;
        yield filterFactory.createInputFilter();
    }

    *createOutputFilter(){
        let {filterFactory} = this;
        yield filterFactory.createOutputFilter();
    }

    /**
     * @returns {Object}
     */
    get map(){
        return this._methods.wrap();
    }

    /**
     * @returns {Object}
     */
    get executor(){
        return calp(this.execute, this, NS);
    }
    
    _onDispose(){
        calp.destroy(this.execute, this, NS);
    }
}

module.exports = RPCProtocol;