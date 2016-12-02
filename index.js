/**
 * Created by tolgahan on 16.11.2016.
 */
"use strict";

const calp = require('calp');
const Soprano = require('soprano');
const errors = Soprano.errors;

const Symbols = Soprano.Symbols;
const MethodCollection = Soprano.MethodCollection;
const NS = Symbol('rpc-ns');

const HEADER = Buffer.from('RPC');

class RPCProtocol extends Soprano.FixedHeaderRequestResponseProtocol {

    constructor(soprano, header = void 0){
        super(soprano, header || HEADER);
        this.setResource(Symbols.map, new MethodCollection());
    }

    //noinspection JSMethodCanBeStatic
    createOutput(){
        return [
            new Soprano.JSONTransformer(false),
            new Soprano.LengthPrefixedTransformer(false)
        ];
    }

    //noinspection JSMethodCanBeStatic
    createInput(){
        return [
            new Soprano.LengthPrefixedTransformer(true),
            new Soprano.JSONTransformer(true)
        ];
    }


    /***
     * @returns {MethodCollection}
     * @private
     */
    get _methods(){
        return this.getResource(Symbols.map);
    }

    async execute(name){
        var args = Array.prototype.slice.call(arguments, 1);
        let obj = {name, args};

        var result;

        result = await this._execute(obj);

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

        return result;
    }

    async handle(err, data, connection){
        try{
            if(err){
                //noinspection ExceptionCaughtLocallyJS
                throw err;
            }

            if(!Array.isArray(data.args)){
                data.args = [data.args, connection];
            } else {
                data.args.push(connection);
            }

            return await this._methods.execute(data.name, data.args);
        } catch (err) {
            return await {error: Object.assign({name: err.name, message: err.message}, err)};
        }
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