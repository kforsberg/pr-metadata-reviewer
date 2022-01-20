import { IMetadataService, MetadataService } from "../src/MetadataService";
import { IGuthubService, GithubService } from "../src/GithubService";
import { MdFile, MdFileValidationResult } from "../src/models";
import axios, { Axios } from "axios";
import { IActionRunner, ActionRunner } from "../src/ActionRunner";

describe('ActionRunner', () => {
    let metadataService: IMetadataService;
    let githubService: IGuthubService;
    let actionRunner: IActionRunner;

    // Default parameters
    const repoOwner = 'kforsberg';
    const repoName = 'pr-metadata-reviewer';
    const token = 'not-real';
    const prId = 123;

    beforeEach(() => {
        githubService = new GithubService(repoOwner, repoName, token, axios, prId);
        metadataService = new MetadataService(githubService, {});
    })

    describe('runAction', () => {
        it('should finish without error', async () => {
            // Set up expected data
            const files: Array<MdFile> = [
                { fileName: 'file1.md', downloadUrl: 'https://localhost:3000/file1.md', metadata: {} },
                { fileName: 'file2.md', downloadUrl: 'https://localhost:3000/file2.md', metadata: {} }
            ];
            const validationResults: MdFileValidationResult = { 
                hasError: false,
                errors: new Map<string, Array<string>>()
            };
            
            const reviewIds: Array<number> = [1,2,3];
            
            // Set up spys
            spyOn(metadataService, 'getPullRequestFiles').and.resolveTo(files);
            spyOn(metadataService, 'checkRequiredTagsForFiles').and.returnValue(validationResults);
            spyOn(githubService, 'getRequestReviewIds').and.resolveTo(reviewIds);
            spyOn(githubService, 'dismissPullRequestReviews');

            actionRunner = new ActionRunner(metadataService, githubService);
            await actionRunner.runAction([]);
            expect(githubService.dismissPullRequestReviews)
                .toHaveBeenCalledOnceWith(reviewIds);
        });

        it('should throw an error', async () => {
            // Set up expected data
            const files: Array<MdFile> = [
                { fileName: 'file1.md', downloadUrl: 'https://localhost:3000/file1.md', metadata: {} },
                { fileName: 'file2.md', downloadUrl: 'https://localhost:3000/file2.md', metadata: {} }
            ];
            const validationResults: MdFileValidationResult = { 
                hasError: true,
                errors: new Map<string, Array<string>>([['file1.md', ['title', 'description']]])
            };
            
            const reviewIds: Array<number> = [1,2,3];
            
            // Set up spys
            spyOn(metadataService, 'getPullRequestFiles').and.resolveTo(files);
            spyOn(metadataService, 'checkRequiredTagsForFiles').and.returnValue(validationResults);
            spyOn(githubService, 'getRequestReviewIds').and.resolveTo(reviewIds);
            spyOn(githubService, 'dismissPullRequestReviews');
            spyOn(githubService, 'submitPullRequestReview');
            actionRunner = new ActionRunner(metadataService, githubService);

            try {
                await actionRunner.runAction([]);
                expect(false).toBeTrue() // fail the test
            } catch (e) {
                expect(e).toEqual('file1.md is missing required metadata [title, description]');
            }
        });
    });

})