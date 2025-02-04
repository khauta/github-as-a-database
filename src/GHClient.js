"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GHClient = void 0;
require('dotenv').config();
var rest_1 = require("@octokit/rest");
var Defaults_1 = require("./constants/Defaults");
var ErrorMessages_1 = require("./constants/ErrorMessages");
var GHClientHelpers_1 = require("./helpers/GHClientHelpers");
var GHClient = /** @class */ (function () {
    function GHClient(args) {
        this.MAX_API_ATTEMPTS = 10;
        this.owner = args.owner;
        this.repo = args.repo;
        this.octokit = new rest_1.Octokit({
            auth: args.personalAccessToken,
        });
        this.committer = args.committer || Defaults_1.DEFAULT_COMMITTER;
    }
    GHClient.prototype.putObject = function (key, value) {
        return __awaiter(this, void 0, void 0, function () {
            var success, remainingAttempts, getResponse, sha, error_1, status_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        success = false;
                        remainingAttempts = this.MAX_API_ATTEMPTS;
                        // Sanitize key and value
                        if (!this.validStorageKey(key))
                            throw new Error(ErrorMessages_1.INVALID_KEY_MESSAGE);
                        _a.label = 1;
                    case 1:
                        if (!(!success && remainingAttempts > 0)) return [3 /*break*/, 9];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, , 8]);
                        return [4 /*yield*/, this.getObjectOctokit(key)];
                    case 3:
                        getResponse = _a.sent();
                        sha = getResponse.data.sha;
                        if (!sha) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.replaceObjectOctokit(key, value, sha)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        if (Array.isArray(getResponse.data))
                            throw new Error('Cannot replace value of a folder');
                        _a.label = 6;
                    case 6:
                        success = true;
                        return [3 /*break*/, 8];
                    case 7:
                        error_1 = _a.sent();
                        if (!(0, GHClientHelpers_1.isGithubApiError)(error_1))
                            throw new Error(ErrorMessages_1.UNKNOWN_ERROR);
                        status_1 = error_1.status;
                        if (status_1 === 404) {
                            this.uploadNewObjectOctokit(key, value);
                            success = true;
                        }
                        else if (status_1 === 401) {
                            throw new Error(ErrorMessages_1.BAD_CREDENTIALS_MESSAGE);
                        }
                        return [3 /*break*/, 8];
                    case 8: return [3 /*break*/, 1];
                    case 9:
                        if (!success)
                            throw new Error(ErrorMessages_1.UNKNOWN_ERROR);
                        return [2 /*return*/];
                }
            });
        });
    };
    GHClient.prototype.removeObject = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var success, remainingAttempts, getResponse, sha, error_2, status_2, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        success = false;
                        remainingAttempts = this.MAX_API_ATTEMPTS;
                        // Sanitize key and value
                        if (!this.validStorageKey(key))
                            throw new Error(ErrorMessages_1.INVALID_KEY_MESSAGE);
                        _a.label = 1;
                    case 1:
                        if (!(!success && remainingAttempts > 0)) return [3 /*break*/, 7];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, this.getObjectOctokit(key)];
                    case 3:
                        getResponse = _a.sent();
                        sha = getResponse.data.sha;
                        return [4 /*yield*/, this.deleteObjectOctokit(key, sha)];
                    case 4:
                        _a.sent();
                        success = true;
                        return [3 /*break*/, 6];
                    case 5:
                        error_2 = _a.sent();
                        if (!(0, GHClientHelpers_1.isGithubApiError)(error_2))
                            throw new Error(ErrorMessages_1.UNKNOWN_ERROR);
                        status_2 = error_2.status, message = error_2.message;
                        switch (status_2) {
                            case 404:
                                success = true;
                                break;
                            case 401:
                                throw new Error(ErrorMessages_1.BAD_CREDENTIALS_MESSAGE);
                            case 409:
                                return [3 /*break*/, 1];
                            default:
                                throw new Error(message);
                        }
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 1];
                    case 7:
                        if (!success)
                            throw new Error(ErrorMessages_1.UNKNOWN_ERROR);
                        return [2 /*return*/];
                }
            });
        });
    };
    GHClient.prototype.getObject = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var getResponse, content, error_3, status_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Sanitize key and value
                        if (!this.validStorageKey(key))
                            throw new Error(ErrorMessages_1.INVALID_KEY_MESSAGE);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getObjectOctokit(key)];
                    case 2:
                        getResponse = _a.sent();
                        content = getResponse.data.content;
                        if (Array.isArray(getResponse.data))
                            throw new Error('Key points to a folder');
                        if (content)
                            return [2 /*return*/, (0, GHClientHelpers_1.convertBase64ToString)(content)];
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        if (!(0, GHClientHelpers_1.isGithubApiError)(error_3))
                            throw new Error(ErrorMessages_1.UNKNOWN_ERROR);
                        status_3 = error_3.status;
                        switch (status_3) {
                            case 404:
                                throw new Error(ErrorMessages_1.OBJECT_NOT_FOUND_MESSAGE);
                            case 401:
                                throw new Error(ErrorMessages_1.BAD_CREDENTIALS_MESSAGE);
                            default:
                                throw new Error(ErrorMessages_1.UNKNOWN_ERROR);
                        }
                        return [3 /*break*/, 4];
                    case 4: throw new Error(ErrorMessages_1.UNKNOWN_ERROR);
                }
            });
        });
    };
    GHClient.prototype.listObjects = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var data, pathPrefix, filteredData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.listObjectsOctokit(key)];
                    case 1:
                        data = (_a.sent()).data;
                        if (!Array.isArray(data))
                            throw new Error('Not a folder');
                        pathPrefix = key.endsWith('*') ? key.substring(0, key.length - 1) : '';
                        filteredData = this.applyListFilter(data, pathPrefix);
                        return [2 /*return*/, filteredData];
                }
            });
        });
    };
    // Check benchmark for splitting .filter into two depending on if pathPrefix exists
    GHClient.prototype.applyListFilter = function (data, pathPrefix) {
        return data.filter(function (object) { return object.name !== Defaults_1.RESERVED_FILE_KEY && object.path.startsWith(pathPrefix); });
    };
    GHClient.prototype.validStorageKey = function (key) {
        // Is this greedy?
        if (key === Defaults_1.RESERVED_FILE_KEY)
            return false;
        var pathRegEx = /^(\/?[\w-]+)+(\.\w+)?$/;
        return pathRegEx.test(key);
    };
    GHClient.prototype.deleteObjectOctokit = function (key, sha) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.octokit.request("DELETE /repos/{owner}/{repo}/contents/{path}", __assign(__assign({ owner: this.owner, repo: this.repo, path: "".concat(key, "/").concat(Defaults_1.RESERVED_FILE_KEY), sha: sha }, (this.committer && {
                        committer: this.committer,
                    })), { message: "Delete made at ".concat(new Date().getTime(), ".") }))];
            });
        });
    };
    GHClient.prototype.getObjectOctokit = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
                        owner: this.owner,
                        repo: this.repo,
                        path: "".concat(key, "/").concat(Defaults_1.RESERVED_FILE_KEY),
                    })];
            });
        });
    };
    GHClient.prototype.listObjectsOctokit = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var correctedKey;
            return __generator(this, function (_a) {
                correctedKey = this.correctListKeyForGitHub(key);
                return [2 /*return*/, this.octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
                        owner: this.owner,
                        repo: this.repo,
                        path: correctedKey,
                    })];
            });
        });
    };
    // The sdk doesn't like '/' and encodes it into '%2F' in the URL
    // If you want to search for 'folder/', it needs to be 'folder'
    GHClient.prototype.correctListKeyForGitHub = function (key) {
        var correctedKey = key;
        if (correctedKey.endsWith('/*'))
            correctedKey = correctedKey.substring(0, correctedKey.length - 2);
        if (correctedKey.endsWith('/'))
            correctedKey = correctedKey.substring(0, correctedKey.length - 1);
        if (correctedKey.endsWith('*')) {
            correctedKey = correctedKey.substring(0, correctedKey.length - 1);
            var arr = correctedKey.split('/');
            arr.pop();
            correctedKey = arr.join('/');
        }
        return correctedKey;
    };
    GHClient.prototype.replaceObjectOctokit = function (key, value, sha) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", __assign(__assign({}, this.generateUploadParams(key, value)), { sha: sha }))];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/, true];
                }
            });
        });
    };
    GHClient.prototype.uploadNewObjectOctokit = function (key, value) {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", __assign(__assign({}, this.generateUploadParams(key, value)), { message: "Added at ".concat(new Date().getTime(), ".") }))];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/, true];
                }
            });
        });
    };
    GHClient.prototype.generateUploadParams = function (key, value) {
        return __assign(__assign({ owner: this.owner, repo: this.repo, path: "".concat(key, "/").concat(Defaults_1.RESERVED_FILE_KEY), message: "Update made at ".concat(new Date().getTime(), ".") }, (this.committer && {
            committer: this.committer,
        })), { content: (0, GHClientHelpers_1.convertStringToBase64)(value) });
    };
    return GHClient;
}());
exports.GHClient = GHClient;
