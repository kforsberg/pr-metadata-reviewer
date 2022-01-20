import axios, { Axios } from "axios";
import { IGuthubService, GithubService } from "../src/GithubService";

describe('GithubService', () => {

    let githubService: IGuthubService;
    let axiosMock: Axios;
    const repoOwner = 'kforsberg';
    const repoName = 'pr-metadata-reviewer';
    const accessToken = 'not-real';
    const prId = 123;

    beforeEach(() => {
        axiosMock = axios;
    })

    describe('getPullRequestFiles', () => {
        it('should call the appropriate URL', async () => {
            spyOn(axiosMock, 'get').and.resolveTo({ data: 'something' });
            githubService = new GithubService(repoOwner, repoName, accessToken, axiosMock, prId);
            await githubService.getPullRequestFiles();
            expect(axiosMock.get).toHaveBeenCalledTimes(1);
            expect(axiosMock.get).toHaveBeenCalledWith('https://api.github.com/repos/kforsberg/pr-metadata-reviewer/pulls/123/files')
        });
    });

    describe('getFileContent', () => {
        it('should call the correct URLs to get the file content', async () => {
            spyOn(axiosMock, 'get')
                .withArgs('https://localhost').and.resolveTo({ data: { download_url: 'https://localhost:3000/test.md' } })
                .withArgs('https://localhost:3000/test.md').and.resolveTo({ data: 'success' });

            githubService = new GithubService(repoOwner, repoName, accessToken, axiosMock, prId);
            const results = await githubService.getFileContent('https://localhost');
            expect(results).toEqual('success');
            expect(axiosMock.get).toHaveBeenCalledTimes(2);
        });
    });

    describe('submitPullRequestReview', () => {
        it('should submit the approval with a comment', async () => {
            spyOn(axiosMock, 'post');
            githubService = new GithubService(repoOwner, repoName, accessToken, axios, prId);
            await githubService.submitPullRequestReview('a comment');
            expect(axiosMock.post)
                .toHaveBeenCalledOnceWith(
                    'https://api.github.com/repos/kforsberg/pr-metadata-reviewer/pulls/123/reviews',
                    JSON.stringify({ event: 'REQUEST_CHANGES', body: 'a comment' }),
                    { headers: { 'Accept': 'application/vnd.github.v3+json' } });
        });
    });

    describe('dismissPullRequestReviews', () => {
        it('should make an API call for each review', async () => {
            spyOn(axiosMock, 'put');
            githubService = new GithubService(repoOwner, repoName, accessToken, axios, prId);
            await githubService.dismissPullRequestReviews([1, 2, 3]);
            expect(axiosMock.put).toHaveBeenCalledTimes(3);
            expect(axiosMock.put)
                .toHaveBeenCalledWith(
                    'https://api.github.com/repos/kforsberg/pr-metadata-reviewer/pulls/123/reviews/1/dismissals',
                    JSON.stringify({ message: 'Metadata was missing but corrected' }),
                    { headers: { 'Accept': 'application/vnd.github.v3+json' } });
            expect(axiosMock.put)
                .toHaveBeenCalledWith(
                    'https://api.github.com/repos/kforsberg/pr-metadata-reviewer/pulls/123/reviews/2/dismissals',
                    JSON.stringify({ message: 'Metadata was missing but corrected' }),
                    { headers: { 'Accept': 'application/vnd.github.v3+json' } });
            expect(axiosMock.put)
                .toHaveBeenCalledWith(
                    'https://api.github.com/repos/kforsberg/pr-metadata-reviewer/pulls/123/reviews/3/dismissals',
                    JSON.stringify({ message: 'Metadata was missing but corrected' }),
                    { headers: { 'Accept': 'application/vnd.github.v3+json' } });
        });
    });

    describe('getRequestReviewIds', () => {
        it('should return review ids', async () => {

            const returnedData = {
                data: [
                    { id: 1, body: 'missing required metadata', user: { login: 'github-actions[bot]' } },
                    { id: 2, body: 'not a comment from a bot', user: { login: 'a real user' } },
                    { id: 3, body: 'missing required metadata', user: { login: 'github-actions[bot]' } }
                ]
            };

            spyOn(axiosMock, 'get')
                .withArgs('https://api.github.com/repos/kforsberg/pr-metadata-reviewer/pulls/123/reviews', { headers: { 'Accept': 'application/vnd.github.v3+json' } })
                .and.resolveTo(returnedData);

            githubService = new GithubService(repoOwner, repoName, accessToken, axios, prId);
            var results = await githubService.getRequestReviewIds();
            expect(results.length).toEqual(2);
            expect(results).toContain(1);
            expect(results).toContain(3);
        })
    });

});