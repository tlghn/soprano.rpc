/**
 * Created by tolgahan on 16.11.2016.
 */
"use strict";

const zlib = require('zlib');
const crypto = require('crypto');

const FilterFactory = require('soprano').FilterFactory;


class TestFilterFactory extends FilterFactory {

    createInputFilter(){
        return [
            zlib.createGunzip(),
            crypto.createDecipher('aes-192-ctr', '123456')
        ];
    }

    createOutputFilter(){
        return [
            crypto.createCipher('aes-192-ctr', '123456'),
            zlib.createGzip()
        ];
    }
}

module.exports = TestFilterFactory;