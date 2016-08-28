(function () {
    "use strict";
    const parser = require('parse-rss');
    const request = require('request-promise');
    const _ = require('underscore');

    function parseItem(item) {
        var meta = item.meta;
        var parsed = {};

        _.each(['title', 'link', 'guid', 'pubDate', 'author', 'description'], key => {
            parsed[key] = item[key];
        });
        parsed.feedUrl = meta.xmlUrl;
        parsed.collectionName = meta.title;
        parsed.categories = meta.categories;
        parsed.thumbnail = item.image.url || meta.image.url || '';
        parsed.enclosure = item["media:content"]['@'];

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
                resolve(parseFeed);
            });
        });
    }

    function feedUrlFromItunesCollectionId(id) {
        return new Promise((resolve, reject) => {
            request({method: 'GET', uri: "https://itunes.apple.com/lookup?id=" + id})
                .then(response => {
                    var parsed = JSON.parse(response);
                    if (parsed.resultCount !== 1) {
                        reject(new Error('Expected 1 result, found ' + parsed.resultCount));
                    }
                    var feedUrl = parsed.results[0].feedUrl;
                    resolve(feedUrl);
                })
                .catch(reject);
        });
    }

    module.exports = {
        parseFeedUrl : parseFeedUrl,
        feedUrlFromItunesCollectionId : feedUrlFromItunesCollectionId
    };
})();