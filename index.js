var crypto  = require("crypto");
var oauth   = require("oauth");
var EasyXml = require('easyxml');
var inflect = require('inflect');

var XERO_BASE_URL = 'https://api.xero.com';
var XERO_API_URL = XERO_BASE_URL + '/api.xro/2.0';

function Xero (key, secret, rsa_key, customHeaders) {
    this.key = key;
    this.secret = secret;

    var headers = { Accept: 'application/json' };
    for(var header in customHeaders) {
        headers[header] = customHeaders[header];
    }

    this.oa = new oauth.OAuth(null, null, key, secret, '1.0', null, "PLAINTEXT", null, headers);
    this.oa._signatureMethod = "RSA-SHA1";
    this.oa._createSignature = function (signatureBase, tokenSecret) {
        return crypto.createSign("RSA-SHA1").update(signatureBase).sign(rsa_key, output_format = "base64");
    };
    
    // Attach convenience methods for entities
    require('./src/entities')(this);
}

Xero.prototype.XERO_BASE_URL = XERO_BASE_URL;
Xero.prototype.XERO_API_URL = XERO_API_URL;

Xero.prototype.call = function (method, path, body, callback) {
    var self = this;
    
    if (typeof body === "function" && callback == undefined) {
        callback = body;
        body = null;
    }

    var post_body = null;
    var content_type = null;
    if (method && method !== 'GET' && body) {
        if (Buffer.isBuffer(body)) {
            post_body = body;
        } else {
            var root = path.match(/([^\/\?]+)/)[1];
            post_body = new EasyXml({rootElement: inflect.singularize(root), rootArray: root, manifest: true}).render(body);
            content_type = 'application/xml';
        }
    }

    var process = function (err, jsonString, res) {
        if (err) {
            return callback(err);
        }
        
        var json = JSON.parse(jsonString);
        
        if (json.Status !== 'OK') {
          return callback(json, res);
        } else {
          return callback(null, json, res);
        }
    };
    return self.oa._performSecureRequest(self.key, self.secret, method, this.XERO_API_URL + path, null, post_body, content_type, callback ? process : null);
};

Xero.prototype.get = function (path, body, callback) {
    this.call('GET', path, body, callback);
};


Xero.prototype.post = function (path, body, callback) {
    this.call('POST', path, body, callback);
};


Xero.prototype.put = function (path, body, callback) {
    this.call('PUT', path, body, callback);
};


Xero.prototype.patch = function (path, body, callback) {
    this.call('PATCH', path, body, callback);
};


Xero.prototype.delete = function (path, body, callback) {
    this.call('DELETE', path, body, callback);
};


module.exports = Xero;