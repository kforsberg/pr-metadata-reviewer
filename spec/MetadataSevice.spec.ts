import { IMetadataService, MetadataService } from '../src/MetadataReviewer'
import { IGuthubService, GithubService } from '../src/GithubService'
import axios, { Axios } from 'axios';

describe('MetadataService', () => {
    let metadataService: IMetadataService;
    let githubServiceMock: IGuthubService;
    let axiosMock: Axios;
    let parseMdMock: any;

    beforeEach(() => {
        axiosMock = axios;
        spyOn(axiosMock, 'get');
        githubServiceMock = new GithubService('kforsberg', 'test-pr', '123', axiosMock, 1);
    })

    describe('getPullRequestFiles', () => {
        it('should build a list of files', async () => {
            spyOn(githubServiceMock, 'getPullRequestFiles').and.resolveTo(['123','456']);
            metadataService = new MetadataService(githubServiceMock, parseMdMock);
            var result = await metadataService.getPullRequestFiles();
        });
    });
});