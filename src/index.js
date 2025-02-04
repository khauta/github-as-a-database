"use strict";
// Object.defineProperty(exports, "__esModule", { value: true });
var GHClient_1 = require("./src/GHClient");
var db = new GHClient_1.GHClient({
    owner: 'khauta',
    repo: 'Relearning',
    personalAccessToken: process.env.GITHUB_ACCESS_TOKEN,
});
db.putObject('demo', 'demo text').then(function (e) {
    return db.removeObject('demo');
}).catch(function (e) {
    debugger;
});
