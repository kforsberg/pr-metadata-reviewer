import { Axios } from 'axios';
import parseMD from 'parse-md';
import { MdFile, MdFileValidationResult, ReviewItem } from './models';

export class MetadataReviewer {

    axios: Axios;
    repoOwner: string;
    repoName: string;

    constructor(repoOwner: string, repoName: string, accessToken: string, axios: Axios) {
        this.repoOwner = repoOwner;
        this.repoName = repoName;
        this.axios = axios;
        this.axios.defaults.headers.common['Authorization'] = `Token ${accessToken}`;
    }

    async getPullRequestFiles(pullRequestId: number): Promise<Array<MdFile>> {
        const response = await this.axios.get(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/pulls/${pullRequestId}/files`);
        const files: Array<any> = response.data;
        const mdFiles: Array<MdFile> = [];
        for (const file of files) {
            const fileName = file['filename'];
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
            results.hasError = validationResult.length > 0;
            results.errors.set(file.fileName, validationResult);
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

    async submitPullRequestReview(pullRequestId: number, comment: String) {
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        const event = 'REQUEST_CHANGES';
        const body = comment;

        const response = await this.axios.post(
            `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/pulls/${pullRequestId}/reviews`,
            { event, body },
            { headers: headers }
        );

        console.log('response: ', response.data);
    }
}