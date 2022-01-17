import { IGuthubService } from "./GithubService";
import { IMetadataService } from "./MetadataService";
import { MdFileValidationResult } from "./models";

export interface IActionRunner {
    runAction: (requiredMetadataTags: Array<string>) => Promise<void>;
}

export class ActionRunner implements IActionRunner {

    metadataService: IMetadataService;
    githubService: IGuthubService;

    constructor(metadataService: IMetadataService, githubService: IGuthubService) {
        this.metadataService = metadataService;
        this.githubService = githubService;
    }

    async runAction(requiredMetadataTags: Array<string>) {
        const files = await this.metadataService.getPullRequestFiles();
        const validationResults = this.metadataService.checkRequiredTagsForFiles(files, requiredMetadataTags);
        const comment = this.createCommentIfError(validationResults);

        if (comment.length > 0) {
            await this.githubService.submitPullRequestReview(comment);
            throw comment;
        } else {
            const metaReviewIds = await this.githubService.getRequestReviewIds();

            if (metaReviewIds.length > 0) {
                await this.githubService.dismissPullRequestReviews(metaReviewIds);
            }
        }
    }

    private createCommentIfError(validationResults: MdFileValidationResult) {
        if (!validationResults.hasError) return '';
    
        let comment = '';
    
        validationResults.errors.forEach((value, key) => {
            if (comment.length > 0) {
                comment += '\n';
            }
            comment += `${key} is missing required metadata [${value.join(', ')}]`;
        });
    
        return comment;
    }
}