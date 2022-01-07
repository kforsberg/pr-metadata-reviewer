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
    constructor(repoOwner, repoName, accessToken, axios, prId) {
        this.repoOwner = repoOwner;
        this.repoName = repoName;
        this.axios = axios;
        this.axios.defaults.headers.common['Authorization'] = `Token ${accessToken}`;
        this.baseUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/pulls/${prId}`;
        this.prId = prId;
    }
    getPullRequestFiles(pullRequestId) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.axios.get(`${this.baseUrl}/files`);
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
            yield this.axios.post(`${this.baseUrl}/reviews`, JSON.stringify({ event, body }), { headers });
        });
    }
    approvePullRequestReviews(pullRequestId, reviewIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = { 'Accept': 'application/vnd.github.v3+json' };
            const event = 'APPROVE';
            // const response = await Promise.all(reviewIds.map(async (id) => await this.axios.post(
            //     `${this.baseUrl}/reviews/${id}/events`,
            //     { event },
            //     { headers: headers }
            // )));
            console.log(`${this.baseUrl}/reviews/${reviewIds[3]}/events`);
            try {
                const response = yield this.axios.put(`${this.baseUrl}/reviews/${reviewIds[3]}/dismissals`, JSON.stringify({ message: 'Metadata was corrected' }), { headers });
                console.log(response);
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log(error);
                }
            }
        });
    }
    getRequestReviewIds(pullRequestId) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = { 'Accept': 'application/vnd.github.v3+json' };
            const response = yield this.axios.get(`${this.baseUrl}/reviews`, { headers });
            const reviews = response.data;
            let ids = [];
            // @ts-ignore
            reviews.map(review => {
                if (review.body.includes("missing required metadata") && review.user.login.includes("github-actions[bot]")) {
                    ids.push(review.id);
                }
            });
            return ids;
        });
    }
}
exports.MetadataReviewer = MetadataReviewer;
//# sourceMappingURL=MetadataReviewer.js.map