import { IMetadataService, MetadataService } from "./MetadataService";
import { IGuthubService, GithubService } from './GithubService';
import axios from 'axios';
import * as core from '@actions/core';
import * as github from '@actions/github';
import parseMD from 'parse-md';
import { ActionRunner } from "./ActionRunner";

async function run() {
    try {
        const requiredMetadataTags = core.getInput('required-metadata', { required: true }).split(',');
        const repoOwner = core.getInput('repo-owner', { required: true });
        const repoName = core.getInput('repo-name', { required: true });
        const token = core.getInput('github-token', { required: true });
        const prId = github.context.issue.number;

        const githubService: IGuthubService = new GithubService(repoOwner, repoName, token, axios, prId);
        const metadataService: IMetadataService = new MetadataService(githubService, parseMD);
        const runner = new ActionRunner(metadataService, githubService);
        await runner.runAction(requiredMetadataTags);
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        } else if (typeof error === 'string') {
            core.setFailed(error);
        }
    }
}

run();