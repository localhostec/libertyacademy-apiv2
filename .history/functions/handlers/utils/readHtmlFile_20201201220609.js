const fs = require('fs');

module.exports.readHTMLFile = function(path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, (err, html) => {
        if (err) {
            throw err;
            callback(err);
        }
        else {
            return callback(null, html);
        }
    });
};