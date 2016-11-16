/**
 * Created by tolgahan on 16.11.2016.
 */
"use strict";

const stream = require('stream');
const utils = require('soprano/utils');

class Input extends stream.Transform {
    constructor(){
        super({readableObjectMode: true});
    }

    _transform(data, encoding, callback){
        if(!this.buffer){
            this.buffer = data;
        } else {
            this.buffer = Buffer.concat([this.buffer, data]);
        }

        if(typeof this.len === 'undefined'){
            var len = utils.decodeUInt32(this.buffer);
            if(len.status === utils.DONE){
                this.len = len.value;
                delete this.buffer;
                return this._transform(len.buffer, encoding, callback);
            }
        } else {
            if(this.buffer.length >= this.len){
                this.push(JSON.parse(this.buffer.slice(0, this.len)));
                delete this.buffer;
                delete this.len;
            }
        }
        
        callback();
    }
}
module.exports = Input;