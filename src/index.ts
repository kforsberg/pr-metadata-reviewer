import { MetadataReviewer } from "./MetadataReviewer";
import axios from 'axios';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { MdFileValidationResult } from "./models";

async function logToGithub(validationResults: MdFileValidationResult) {
    if (validationResults.hasError) {
        validationResults.errors.forEach((value, key) => {
            console.log(`${key} is missing required metadata [${value.join(', ')}]`)
        })
    }
}

async function run() {
    // const repoOwner = core.getInput('repo-owner', { required: true });
    // const repoName = core.getInput('repo-name', { required: true });
    // const token = core.getInput('github-token', { required: true });
    // const requiredMetadataTags = core.getInput('required-metadata', { required: true }).split(',');
    const requiredMetadataTags: Array<string> = ['title', 'description', 'ms.date', 'ms.topic', 'ms.prod', 'ms.custom', 'ft.audience'];
    
    const reviewer = new MetadataReviewer("kforsberg", "pr-block-test", "" /**"PERSONAL ACCESS TOKEN"**/, axios);
    
    const files = await reviewer.getPullRequestFiles(1);
    const validationResults = reviewer.checkRequiredTagsForFiles(files, requiredMetadataTags);
    await logToGithub(validationResults);
}

run();