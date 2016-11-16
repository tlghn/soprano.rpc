/**
 * Created by tolgahan on 16.11.2016.
 */
"use strict";

const stream = require('stream');
const utils = require('soprano/utils');

class Output extends stream.Transform {
    constructor(){
        super({writableObjectMode: true});
    }

    _transform(data, encoding, callback){
        let buffer = Buffer.from(JSON.stringify(data), 'utf8');
        var length = utils.encodeUInt32(buffer.length);
        this.push(length);
        this.push(buffer);
        callback();
    }
}

module.exports = Output;