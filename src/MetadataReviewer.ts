import { Axios } from 'axios';
import parseMD from 'parse-md';
import { MdFile, MdFileValidationResult } from './models';

export class MetadataReviewer {

    axios: Axios;
    repoOwner: string;
    repoName: string;
    baseUrl: string;
    prId: number;

    constructor(repoOwner: string, repoName: string, accessToken: string, axios: Axios, prId: number) {
        this.repoOwner = repoOwner;
        this.repoName = repoName;
        this.axios = axios;
        this.axios.defaults.headers.common['Authorization'] = `Token ${accessToken}`;
        this.baseUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/pulls/${prId}`;
        this.prId = prId;
    }

    async getPullRequestFiles(): Promise<Array<MdFile>> {
        const response = await this.axios.get(`${this.baseUrl}/files`);
        const files: Array<any> = response.data;
        const mdFiles: Array<MdFile> = [];

        for (const file of files) {
            const fileName = file['filename'];

            if (!fileName.endsWith(".md")) {
                continue;
            }

            const rawData = await this.getContentForFile(file['contents_url']);
            const metadata = parseMD(rawData);
            mdFiles.push({ downloadUrl: file['contents_url'], fileName, metadata: metadata['metadata'] });
        }

        return mdFiles;
    }

    private async getContentForFile(file: string) {
        const response = await this.axios.get(file);
        const data = await this.axios.get(response.data['download_url']);

        return data.data;
    }

    checkRequiredTagsForFiles(files: Array<MdFile>, requiredMetadataTags: Array<string>): MdFileValidationResult {
        const results: MdFileValidationResult = { hasError: false, errors: new Map() }

        for (const file of files) {
            const validationResult = this.checkRequiredTagsForFile(file, requiredMetadataTags);

            if (validationResult.length > 0) {
                results.hasError = true;
                results.errors.set(file.fileName, validationResult);
            }
        }

        return results;
    }

    private checkRequiredTagsForFile(file: MdFile, requiredMetadataTags: Array<string>): Array<string> {
        const allKeys = Object.keys(file.metadata);
        const failedKeys: Array<string> = [];

        for (const requiredTag of requiredMetadataTags) {
            // check that the key exists in the MD file and that they're not empty
            if (!allKeys.includes(requiredTag) || (file.metadata[requiredTag] === '' || file.metadata[requiredTag] === null)) {
                failedKeys.push(requiredTag);
                continue;
            }
        }

        return failedKeys;
    }

    async submitPullRequestReview(comment: String) {
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        const event = 'REQUEST_CHANGES';
        const body = comment;

        await this.axios.post(
            `${this.baseUrl}/reviews`,
            JSON.stringify({ event, body }),
            { headers }
        );
    }

    async dismissPullRequestReviews(reviewIds: Array<number>) {
        const headers = { 'Accept': 'application/vnd.github.v3+json' };

        await Promise.all(reviewIds.map(async (id) => await this.axios.put(
            `${this.baseUrl}/reviews/${id}/dismissals`,
            JSON.stringify({ message: 'Metadata was missing but corrected' }),
            { headers }
        )));

    }

    async getRequestReviewIds() {
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        const response = await this.axios.get(
            `${this.baseUrl}/reviews`,
            { headers }
        );
        const reviews = response.data;
        let ids: Array<number> = [];

        // @ts-ignore
        reviews.map(review => {
            if (review.body.includes("missing required metadata") &&
                review.user.login.includes("github-actions[bot]")) {
                ids.push(review.id);
            }
        })

        return ids;
    }
}