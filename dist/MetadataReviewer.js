"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataReviewer = void 0;
const parse_md_1 = __importDefault(require("parse-md"));
class MetadataReviewer {
    constructor(repoOwner, repoName, accessToken, axios) {
        this.repoOwner = repoOwner;
        this.repoName = repoName;
        this.axios = axios;
        this.axios.defaults.headers.common['Authorization'] = `Token ${accessToken}`;
    }
    getPullRequestFiles(pullRequestId) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.axios.get(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/pulls/${pullRequestId}/files`);
            const files = response.data;
            const mdFiles = [];
            for (const file of files) {
                const fileName = file['filename'];
                if (!fileName.endsWith(".md")) {
                    continue;
                }
                const rawData = yield this.getContentForFile(file['contents_url']);
                const metadata = (0, parse_md_1.default)(rawData);
                mdFiles.push({ downloadUrl: file['contents_url'], fileName, metadata: metadata['metadata'] });
            }
            return mdFiles;
        });
    }
    getContentForFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.axios.get(file);
            const data = yield this.axios.get(response.data['download_url']);
            return data.data;
        });
    }
    checkRequiredTagsForFiles(files, requiredMetadataTags) {
        const results = { hasError: false, errors: new Map() };
        for (const file of files) {
            const validationResult = this.checkRequiredTagsForFile(file, requiredMetadataTags);
            console.log(`${file} validation result: ${validationResult}`);
            if (validationResult.length > 0) {
                results.hasError = true;
                results.errors.set(file.fileName, validationResult);
            }
        }
        return results;
    }
    checkRequiredTagsForFile(file, requiredMetadataTags) {
        const allKeys = Object.keys(file.metadata);
        const failedKeys = [];
        for (const requiredTag of requiredMetadataTags) {
            // check that the key exists in the MD file and that they're not empty
            if (!allKeys.includes(requiredTag) || (file.metadata[requiredTag] === '' || file.metadata[requiredTag] === null)) {
                failedKeys.push(requiredTag);
                continue;
            }
        }
        return failedKeys;
    }
    submitPullRequestReview(pullRequestId, comment) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = { 'Accept': 'application/vnd.github.v3+json' };
            const event = 'REQUEST_CHANGES';
            const body = comment;
            yield this.axios.post(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/pulls/${pullRequestId}/reviews`, { event, body }, { headers: headers });
        });
    }
}
exports.MetadataReviewer = MetadataReviewer;
//# sourceMappingURL=MetadataReviewer.js.map