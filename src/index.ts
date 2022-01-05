import { MetadataReviewer } from "./MetadataReviewer";
import axios from 'axios';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { MdFileValidationResult } from "./models";

async function createCommentIfError(validationResults: MdFileValidationResult) {
    let comment = '';

    if (!validationResults.hasError) return '';

    validationResults.errors.forEach((value, key) => {
        if (comment.length > 0) {
            comment += '\n';
        }
        comment += `${key} is missing required metadata [${value.join(', ')}]`;
        console.log(comment);
    });

    return comment;
}

async function run() {
    const prId = 1;
    // const repoOwner = core.getInput('repo-owner', { required: true });
    // const repoName = core.getInput('repo-name', { required: true });
    // const token = core.getInput('github-token', { required: true });
    // const requiredMetadataTags = core.getInput('required-metadata', { required: true }).split(',');
    const requiredMetadataTags: Array<string> = ['title', 'description', 'ms.date', 'ms.topic', 'ms.prod', 'ms.custom', 'ft.audience'];

    const reviewer = new MetadataReviewer("kforsberg", "pr-block-test", "" /**"PERSONAL ACCESS TOKEN"**/, axios);

    const files = await reviewer.getPullRequestFiles(prId);
    const validationResults = reviewer.checkRequiredTagsForFiles(files, requiredMetadataTags);

    const comment = await createCommentIfError(validationResults);

    reviewer.submitPullRequestComment(prId, comment);
}

run();