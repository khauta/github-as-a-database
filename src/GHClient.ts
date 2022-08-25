require('dotenv').config();
import { Octokit } from '@octokit/rest';
import path = require('path');
import { DEFAULT_COMMITTER, RESERVED_FILE_KEY } from './constants/Defaults';
import {
  INTERNAL_ERROR_MESSAGE,
  UNKNOWN_ERROR,
  OBJECT_NOT_FOUND_MESSAGE,
  INVALID_KEY_MESSAGE,
  BAD_CREDENTIALS_MESSAGE,
} from './constants/ErrorMessages';
import { convertBase64ToString, convertStringToBase64, isGithubApiError } from './helpers/GHClientHelpers';
import { OctokitGetEndpoint, OctokitGetEndpointData, OctokitDeleteEndpoint } from './types/GithubTypes';

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
export class GHClient {
  private readonly MAX_API_ATTEMPTS = 10;

  private owner: string;
  private repo: string;
  private octokit: Octokit;
  private committer?: Committer;

  constructor(args: Configuration) {
    this.owner = args.owner;
    this.repo = args.repo;
    this.octokit = new Octokit({
      auth: args.personalAccessToken,
    });
    this.committer = args.committer || DEFAULT_COMMITTER;
  }

  public async putObject(key: string, value: string) {
    let success = false;
    let remainingAttempts = this.MAX_API_ATTEMPTS;
    // Sanitize key and value
    if (!this.validStorageKey(key)) return Promise.reject(INVALID_KEY_MESSAGE);
    while (!success && remainingAttempts > 0) {
      try {
        // If this response fails with 404, means that the object does not exist yet.
        const getResponse: OctokitGetEndpoint['response'] = await this.getObjectOctokit(key);
        const { sha } = getResponse.data as OctokitGetEndpointData;

        // If sha exists, that means the object exists.
        // Otherwise if sha is undefined but call succeeded, it means it's a folder
        if (sha) await this.replaceObjectOctokit(key, value, sha);
        else if (Array.isArray(getResponse.data)) return Promise.reject('Cannot replace value of a folder');
        success = true;
      } catch (error) {
        if (!isGithubApiError(error)) return Promise.reject(UNKNOWN_ERROR);

        const { status } = error;
        if (status === 404) {
          this.uploadNewObjectOctokit(key, value);
          success = true;
        } else if (status === 401) {
          return Promise.reject(BAD_CREDENTIALS_MESSAGE);
        }
      }
    }
    if (!success) return Promise.reject(UNKNOWN_ERROR);
  }

  public async removeObject(key: string): Promise<string | undefined> {
    let success = false;
    let remainingAttempts = this.MAX_API_ATTEMPTS;
    // Sanitize key and value
    if (!this.validStorageKey(key)) return Promise.reject(INVALID_KEY_MESSAGE);
    while (!success && remainingAttempts > 0) {
      try {
        const getResponse: OctokitGetEndpoint['response'] = await this.getObjectOctokit(key);
        const { sha, content } = getResponse.data as OctokitGetEndpointData;
        await this.deleteObjectOctokit(key, sha);
        // clean up if directory is empty
        return content;
      } catch (error) {
        if (!isGithubApiError(error)) return Promise.reject(UNKNOWN_ERROR);

        const { status, message } = error;
        if (status === 404) success = true;
        else if (status === 409) continue;
        else if (status === 401) return Promise.reject(BAD_CREDENTIALS_MESSAGE);
        else return Promise.reject(message);
      }
    }
    return Promise.reject(UNKNOWN_ERROR);
  }

  public async getObject(key: string): Promise<string> {
    // Sanitize key and value
    if (!this.validStorageKey(key)) return Promise.reject(INVALID_KEY_MESSAGE);
    try {
      const getResponse: OctokitGetEndpoint['response'] = await this.getObjectOctokit(key);
      const { content } = getResponse.data as OctokitGetEndpointData;

      if (Array.isArray(getResponse.data)) return Promise.reject('Key points to a folder');

      if (content) return convertBase64ToString(content);
    } catch (error) {
      if (!isGithubApiError(error)) return Promise.reject(UNKNOWN_ERROR);

      const { status } = error;
      if (status === 404) return Promise.reject(OBJECT_NOT_FOUND_MESSAGE);
      else if (status === 401) return Promise.reject(BAD_CREDENTIALS_MESSAGE);
    }
    return Promise.reject(UNKNOWN_ERROR);
  }

  public async listObjects(key: string): Promise<OctokitGetEndpointData[]> {
    const { data } = await this.listObjectsOctokit(key);
    if (!Array.isArray(data)) return Promise.reject('Not a folder');
    const pathPrefix = key.endsWith('*') ? key.substring(0, key.length - 1) : '';
    const filteredData = this.applyListFilter(data, pathPrefix);
    debugger
    return filteredData;
  }

  // Check benchmark for splitting .filter into two depending on if pathPrefix exists
  private applyListFilter(data: OctokitGetEndpointData[], pathPrefix: string): OctokitGetEndpointData[] {
    return data.filter((object) => object.name !== RESERVED_FILE_KEY && object.path.startsWith(pathPrefix));
  }

  private validStorageKey(key: string): boolean {
    // Is this greedy?
    if (key === RESERVED_FILE_KEY) return false;
    const pathRegEx = /^(\/?[\w-]+)+(\.\w+)?$/;
    return pathRegEx.test(key);
  }

  private async deleteObjectOctokit(key: string, sha: string): Promise<OctokitDeleteEndpoint['response']> {
    try {
      return this.octokit.request(`DELETE /repos/{owner}/{repo}/contents/{path}`, {
        owner: this.owner,
        repo: this.repo,
        path: `${key}/${RESERVED_FILE_KEY}`,
        sha: sha,
        ...(this.committer && {
          committer: this.committer,
        }),
        message: `Delete made at ${new Date().getTime()}.`,
      });
    } catch (error) {
      throw error;
    }
  }

  private async getObjectOctokit(key: string): Promise<OctokitGetEndpoint['response']> {
    try {
      return this.octokit.request(`GET /repos/{owner}/{repo}/contents/{path}`, {
        owner: this.owner,
        repo: this.repo,
        path: `${key}/${RESERVED_FILE_KEY}`,
      });
    } catch (error) {
      throw error;
    }
  }

  private async listObjectsOctokit(key: string): Promise<OctokitGetEndpoint['response']> {
    try {
      const correctedKey = this.correctListKeyForGitHub(key);
      debugger
      return this.octokit.request(`GET /repos/{owner}/{repo}/contents/{path}`, {
        owner: this.owner,
        repo: this.repo,
        path: correctedKey,
      });
    } catch (error) {
      throw error;
    }
  }

  // The sdk doesn't like '/' and encodes it into '%2F' in the URL
  // If you want to search for 'folder/', it needs to be 'folder'
  private correctListKeyForGitHub(key: string): string {
    let correctedKey = key;
    if (correctedKey.endsWith('/*')) correctedKey = correctedKey.substring(0, correctedKey.length - 2);
    if (correctedKey.endsWith('/')) correctedKey = correctedKey.substring(0, correctedKey.length - 1);
    if (correctedKey.endsWith('*')) {
      correctedKey = correctedKey.substring(0, correctedKey.length - 1);
      const arr = correctedKey.split('/');
      arr.pop();
      correctedKey = arr.join('/');
    }
    return correctedKey;
  }

  private async replaceObjectOctokit(key: string, value: string, sha: string): Promise<boolean> {
    try {
      await this.octokit.request(`PUT /repos/{owner}/{repo}/contents/{path}`, {
        ...this.generateUploadParams(key, value),
        sha: sha,
      });
    } catch (error) {
      return false;
    }
    return true;
  }

  private async uploadNewObjectOctokit(key: string, value: string): Promise<boolean> {
    try {
      await this.octokit.request(`PUT /repos/{owner}/{repo}/contents/{path}`, {
        ...this.generateUploadParams(key, value),
        message: `Added at ${new Date().getTime()}.`,
      });
    } catch (error) {
      return false;
    }
    return true;
  }

  private generateUploadParams(key: string, value: string): any {
    return {
      owner: this.owner,
      repo: this.repo,
      path: `${key}/${RESERVED_FILE_KEY}`,
      message: `Update made at ${new Date().getTime()}.`,
      ...(this.committer && {
        committer: this.committer,
      }),
      content: convertStringToBase64(value),
    };
  }
}
