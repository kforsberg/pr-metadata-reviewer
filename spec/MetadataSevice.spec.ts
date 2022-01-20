import { IMetadataService, MetadataService } from '../src/MetadataService'
import { IGuthubService, GithubService } from '../src/GithubService'
import axios, { Axios } from 'axios';
import { MdFile } from '../src/models';

describe('MetadataService', () => {
    let metadataService: IMetadataService;
    let githubServiceMock: IGuthubService;
    let axiosMock: Axios;
    let parseMdMock = (data: any) => { return { metadata: { test: '123', test2: '456' } } }

    beforeEach(() => {
        axiosMock = axios;
        spyOn(axiosMock, 'get');
        githubServiceMock = new GithubService('kforsberg', 'test-pr', '123', axiosMock, 1);
    })

    describe('getPullRequestFiles', () => {
        it('should build a list of files', async () => {
            const files = [
                { filename: 'documents/test.md', contents_url: 'https://localhost:3000' },
                { filename: 'documents/test2.md', contents_url: 'https://localhost:4000' },
                { filename: 'documents/test.json', contents_url: 'https://localhost:5000' }
            ]
            spyOn(githubServiceMock, 'getPullRequestFiles').and.resolveTo(files);
            spyOn(githubServiceMock, 'getFileContent').and.resolveTo('test content')
            metadataService = new MetadataService(githubServiceMock, parseMdMock);
            var result = await metadataService.getPullRequestFiles();
            expect(result.length).toEqual(2);
        });
    });

    describe('checkRequiredTagsForFiles', () => {
        it('should return success if all tags are required tags', () => {
            const mdFiles: Array<MdFile> = [
                { fileName: 'test.md', downloadUrl: '', metadata: { title: 'Test Document', description: 'Test' } },
                { fileName: 'test2.md', downloadUrl: '', metadata: { title: 'Test Document 2', description: 'Test 2' } }
            ];

            metadataService = new MetadataService(githubServiceMock, parseMdMock);
            const result = metadataService.checkRequiredTagsForFiles(mdFiles, ['title', 'description']);
            expect(result.hasError).toBeFalse();
        });

        it('should return success if all tags are required tags with extras', () => {
            const mdFiles: Array<MdFile> = [
                { fileName: 'test.md', downloadUrl: '', metadata: { title: 'Test Document', description: 'Test' } },
                { fileName: 'test2.md', downloadUrl: '', metadata: { title: 'Test Document 2', description: 'Test 2', anotherField: 'Should work' } }
            ];

            metadataService = new MetadataService(githubServiceMock, parseMdMock);
            const result = metadataService.checkRequiredTagsForFiles(mdFiles, ['title', 'description']);
            expect(result.hasError).toBeFalse();
        });

        it('should return failure not all required tags are present', () => {
            const mdFiles: Array<MdFile> = [
                { fileName: 'test.md', downloadUrl: '', metadata: { title: 'Test Document', description: 'Test' } },
                { fileName: 'test2.md', downloadUrl: '', metadata: { title: 'Test Document 2', description: 'Test 2', anotherField: 'Should work' } }
            ];

            metadataService = new MetadataService(githubServiceMock, parseMdMock);
            const result = metadataService.checkRequiredTagsForFiles(mdFiles, ['title', 'description', 'anotherField']);
            expect(result.hasError).toBeTrue();
            const error = result.errors.get('test.md');
            expect(error?.length).toEqual(1);
            expect(error![0]).toEqual('anotherField');
        });
    });
});