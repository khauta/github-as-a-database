"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.convertBase64ToString = exports.convertStringToBase64 = exports.isGithubApiError = void 0;
var isGithubApiError = function (x) {
    return typeof x.status === 'number';
};
exports.isGithubApiError = isGithubApiError;
var convertStringToBase64 = function (value) {
    return Buffer.from(value).toString('base64');
};
exports.convertStringToBase64 = convertStringToBase64;
var convertBase64ToString = function (value) {
    return Buffer.from(value, 'base64').toString('ascii');
};
exports.convertBase64ToString = convertBase64ToString;
var sleep = function (ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
};
exports.sleep = sleep;
