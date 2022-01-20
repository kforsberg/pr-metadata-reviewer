import { Axios } from "axios";

export interface IGuthubService {
    getPullRequestFiles: () => Promise<Array<any>>
    getFileContent: (file: string) => Promise<any>
    submitPullRequestReview: (comment:string) => Promise<void>
    dismissPullRequestReviews: (reviewIds: Array<number>) => Promise<void>
    getRequestReviewIds: () => Promise<Array<number>>
}

export class GithubService implements IGuthubService {
    private baseUrl: string;
    private axios: Axios;

    constructor(repoOwner: string, repoName: string, accessToken: string, axios: Axios, prId: number) {
        this.axios = axios;
        this.axios.defaults.headers.common['Authorization'] = `Token ${accessToken}`;
        this.baseUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/pulls/${prId}`;
    }

    async getPullRequestFiles() {
        const response = await this.axios.get(`${this.baseUrl}/files`);
        return response.data;
    }

    async getFileContent(file: string) {
        const response = await this.axios.get(file);
        const data = await this.axios.get(response.data['download_url']);

        return data.data;
    }

    async submitPullRequestReview(comment: string) {
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        const event = 'REQUEST_CHANGES';
        const body = comment;

        await this.axios.post(
            `${this.baseUrl}/reviews`,
            JSON.stringify({ event, body }),
            { headers }
        );
    }

    async dismissPullRequestReviews(reviewIds: Array<number>) {
        const headers = { 'Accept': 'application/vnd.github.v3+json' };

        await Promise.all(reviewIds.map(async (id) => await this.axios.put(
            `${this.baseUrl}/reviews/${id}/dismissals`,
            JSON.stringify({ message: 'Metadata was missing but corrected' }),
            { headers }
        )));
    }

    async getRequestReviewIds() {
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        const response = await this.axios.get(
            `${this.baseUrl}/reviews`,
            { headers }
        );
        const reviews = response.data;
        let ids: Array<number> = [];

        // @ts-ignore
        reviews.map(review => {
            if (review.body.includes("missing required metadata") &&
                review.user.login.includes("github-actions[bot]")) {
                ids.push(review.id);
            }
        })

        return ids;
    }

}