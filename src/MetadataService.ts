import { IGuthubService } from './GithubService';
import { MdFile, MdFileValidationResult } from './models';

export interface IMetadataService {
    getPullRequestFiles: () => Promise<Array<MdFile>>
    checkRequiredTagsForFiles: (files: Array<MdFile>, requiredMetadataTags: Array<string>) => MdFileValidationResult
}

export class MetadataService implements IMetadataService {

    githubService: IGuthubService;
    parseMd: any;

    constructor(githubService: IGuthubService, parseMd: any) {
        this.githubService = githubService;
        this.parseMd = parseMd;
    }

    async getPullRequestFiles(): Promise<Array<MdFile>> {
        const files = await this.githubService.getPullRequestFiles();
        const mdFiles: Array<MdFile> = [];

        for (const file of files) {
            const fileName = file['filename'];

            if (!fileName.endsWith(".md")) {
                continue;
            }

            const rawData = await this.githubService.getFileContent(file['contents_url']);
            const metadata = this.parseMd(rawData);
            mdFiles.push({ downloadUrl: file['contents_url'], fileName, metadata: metadata['metadata'] });
        }

        return mdFiles;
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
}