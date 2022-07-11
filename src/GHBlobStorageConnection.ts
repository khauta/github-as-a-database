require('dotenv').config();
import { Octokit } from "@octokit/rest";
import { Endpoints } from "@octokit/types";
import { SHA_MISSING_ERROR } from "./errorMessages";

interface Committer {
  name: string;
  email: string;
}

interface Configuration {
  owner: string;
  repo: string;
  personalAccessToken: string;
  committer?: Committer;
}

interface GithubError {
  message: string;
  documentation_url: string;
}

const isApiError = (x: any): x is GithubError => {
  return typeof x.message === 'string';
};

type getContent = Endpoints["GET /repos/{owner}/{repo}/contents/{path}"];

export class GHBlobStorageConnection {
  private owner: string;
  private repo: string;
  private octokit: Octokit
  private committer?: Committer

  constructor(args: Configuration) {
    this.owner = args.owner
    this.repo = args.repo
    this.octokit = new Octokit({
      auth: args.personalAccessToken
    })
    this.committer = args.committer
  }

  public async uploadObject(key: string, value: string): Promise<boolean> {
    // Sanitize key and value
    this.validateKey(key)
    try {
      const response: getContent['response'] = await this.octokit.request(`GET /repos/{owner}/{repo}/contents/{path}`, {
        owner: this.owner,
        repo: this.repo,
        path: key,
      })
      const data = response.data as any

      const params = {
        owner: this.owner,
        repo: this.repo,
        path: key,
        message: `Request made at ${new Date().getTime()}.`,
        ...(this.committer && {
          committer: this.committer
        }),
        content: Buffer.from(value).toString('base64')
      }
      debugger
      if (data.sha) {
        debugger
        await this.octokit.request(`PUT /repos/{owner}/{repo}/contents/{path}`, {
          ...params,
          sha: data.sha
        })
      } else {
        await this.octokit.request(`PUT /repos/{owner}/{repo}/contents/{path}`, params)
      }
    } catch (error) {
      if (isApiError(error)) {
        const { message } = error
        if (message === SHA_MISSING_ERROR) {
          // Throw error?
        }
      }
      debugger
      return false
    }
    return true
  }

  private validateKey(key: string): boolean {
    // Is this greedy?
    const pathRegEx = /^(\/?[\w-]+)+(\.\w+)?$/
    if (!pathRegEx.test(key))
      throw new Error('Bad key, please make sure it is a valid path.')
    return true
  }
  
} 