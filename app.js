(function () {
    "use strict";
    const parser = require('parse-rss');
    const request = require('request-promise');
    const _ = require('underscore');

    function duration(old) {
        var sum = 0;
        var arr = old.split(':');
        for(var i = arr.length; i > 0; i-- ) {
            sum += arr[i - 1] * Math.pow(60, arr.length - i);
        }
        return sum;
    }

    function parseItem(item) {
        var meta = item.meta;
        var parsed = {};

        _.each(['title', 'pubDate', 'description'], key => {
            parsed[key] = item[key];
        });
        parsed.enclosure = item.enclosures[0];
        parsed.enclosure.duration = duration(item['itunes:duration']['#']);

        return parsed;
    }

    function parseFeed(rss) {
        return _.map(rss, parseItem);
    }

    function parseFeedUrl(url) {
        return new Promise(function (resolve, reject) {
            parser(url, (err, rss) => {
                if (err) {
                    reject(err);
                }
                resolve(parseFeed(rss));
            });
        });
    }

    function feedFromItunesCollectionId(id) {
        return new Promise((resolve, reject) => {
            request({method: 'GET', uri: "https://itunes.apple.com/lookup?id=" + id})
                .then(response => {
                    var parsed = JSON.parse(response);
                    if (parsed.resultCount !== 1) {
                        reject(new Error('Expected 1 result, found ' + parsed.resultCount));
                    }
                    resolve(parsed.results[0]);
                })
                .catch(reject);
        });
    }

    module.exports = {
        parseFeedUrl : parseFeedUrl,
        feedFromItunesCollectionId : feedFromItunesCollectionId
    };
})();