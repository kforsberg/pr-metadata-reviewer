import { MetadataReviewer } from "./MetadataReviewer";
import axios from 'axios';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { MdFileValidationResult } from "./models";

async function createCommentIfError(validationResults: MdFileValidationResult) {
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

async function run() {
    try {
        const requiredMetadataTags = core.getInput('required-metadata', { required: true }).split(',');
        const repoOwner = core.getInput('repo-owner', { required: true });
        const repoName = core.getInput('repo-name', { required: true });
        const token = core.getInput('github-token', { required: true });
        const prId = github.context.issue.number;

        const reviewer = new MetadataReviewer(repoOwner, repoName, token, axios, prId);
        const files = await reviewer.getPullRequestFiles();
        const validationResults = reviewer.checkRequiredTagsForFiles(files, requiredMetadataTags);
        const comment = await createCommentIfError(validationResults);

        if (comment.length > 0) {
            await reviewer.submitPullRequestReview(comment);

            core.setFailed(comment);
        } else {
            const metaReviewIds = await reviewer.getRequestReviewIds();

            if (metaReviewIds.length > 0) {
                await reviewer.dismissPullRequestReviews(metaReviewIds);
            }
        }
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
    }
}

run();