require('dotenv').config();
import { Octokit } from "@octokit/rest";
import { Endpoints } from "@octokit/types";
import { HTTP_NOT_FOUND, SHA_MISSING_ERROR } from "./errorMessages";

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
type deleteContent = Endpoints["DELETE /repos/{owner}/{repo}/contents/{path}"];

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

  public async putObject(key: string, value: string): Promise<boolean> {
    // Sanitize key and value
    this.validateKey(key)
    try {
      const response: getContent['response'] = await this.octokit.request(`GET /repos/{owner}/{repo}/contents/{path}`, {
        owner: this.owner,
        repo: this.repo,
        path: key,
      })
      const data = response.data as any
      if (data.sha) return this.replaceBlob(key, value, data.sha)

    } catch (error) {
      if (!isApiError(error)) return Promise.reject('Unknown error occured')

      const { message } = error
      if (message === SHA_MISSING_ERROR) {
        return Promise.reject('Not able to update at this time')
      } else if (message === HTTP_NOT_FOUND) {
        return this.uploadNewBlob(key, value)
      }

      return Promise.reject('Error occurred')
    }
    return true
  }

  public async removeObject(key: string): Promise<boolean> {
    try {
      const getResponse: getContent['response'] = await this.octokit.request(`GET /repos/{owner}/{repo}/contents/{path}`, {
        owner: this.owner,
        repo: this.repo,
        path: key,
      })

      const data = getResponse.data as any
      debugger
      // It's okay if it has already been deleted/ unable to find it
      if (!data.sha) return true

      const deleteResponse: deleteContent['response'] = await this.octokit.request(`DELETE /repos/{owner}/{repo}/contents/{path}`, {
        owner: this.owner,
        repo: this.repo,
        path: key,
        sha: data.sha,
        message: `Delete made at ${new Date().getTime()}.`,
      })

      return true
    } catch (error) {
      if (!isApiError(error)) return Promise.reject('Unknown error occured')

      const { message } = error
      if (message === HTTP_NOT_FOUND) {
        return true
      }
      // Be more precise and throw errors
      return Promise.reject('Error occurred')
    }
  }

  public async getObject(key: string) {

  }

  private async replaceBlob(key: string, value: string, sha: string): Promise<boolean> {
    try {
      await this.octokit.request(`PUT /repos/{owner}/{repo}/contents/{path}`, {
        ...this.generateUploadParams(key, value),
        sha: sha
      })
    } catch (error) {
      return false
    }
    return true
  }

  private async uploadNewBlob(key: string, value: string): Promise<boolean> {
    try {
      await this.octokit.request(`PUT /repos/{owner}/{repo}/contents/{path}`, this.generateUploadParams(key, value))
    } catch (error) {
      return false
    }
    return true
  }

  private validateKey(key: string): boolean {
    // Is this greedy?
    const pathRegEx = /^(\/?[\w-]+)+(\.\w+)?$/
    if (!pathRegEx.test(key)) throw new Error('Bad key, please make sure it is a valid path.')
    return true
  }

  private convertStringToBase64(value: string): string {
    return Buffer.from(value).toString('base64')
  }
  
  private generateUploadParams(path: string, value: string): any {
    return {
      owner: this.owner,
      repo: this.repo,
      path: path,
      message: `Update made at ${new Date().getTime()}.`,
      ...(this.committer && {
        committer: this.committer
      }),
      content: this.convertStringToBase64(value)
    }
  }
} 