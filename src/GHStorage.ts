require("dotenv").config();
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
  return typeof x.message === "string";
};

const DEFAULT_COMMITTER = {
  name: "Monalisa Octocat",
  email: "octocat@github.com",
};

type OctokitGetEndpoint =
  Endpoints["GET /repos/{owner}/{repo}/contents/{path}"];
type OctokitGetEndpointData =
  Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]['response']['data'];
type OctokitDeleteEndpoint =
  Endpoints["DELETE /repos/{owner}/{repo}/contents/{path}"];

export class GHStorage {
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

  public async putObject(key: string, value: string): Promise<boolean> {
    // Sanitize key and value
    this.validateKey(key);
    try {
      // If this response fails with 404, means that the object does not exist yet.
      const getResponse: OctokitGetEndpoint["response"] = await this.getObjectOctokit(key);
      const { sha } = getResponse.data as OctokitGetEndpointData

      // If sha exists, that means the object exists.
      if (sha) return this.replaceObjectOctokit(key, value, sha);

      return Promise.reject("Unknown error occurred");
    } catch (error) {
      if (!isApiError(error)) return Promise.reject("Unknown error occured");

      const { message } = error;
      if (message === SHA_MISSING_ERROR) {
        return Promise.reject("Not able to update at this time");
      } else if (message === HTTP_NOT_FOUND) {
        return this.uploadNewObjectOctokit(key, value);
      }

      return Promise.reject("Error occurred");
    }
  }

  public async removeObject(key: string): Promise<string | null> {
    try {
      const getResponse: OctokitGetEndpoint["response"] = await this.getObjectOctokit(key);
      const { sha, content } = getResponse.data as any;

      // It's okay if it has already been deleted/ unable to find it
      if (!sha) return null;

      await this.deleteObjectOctokit(key, sha);
      return content;
    } catch (error) {
      if (!isApiError(error)) return Promise.reject("Unknown error occured");

      const { message } = error;
      if (message === HTTP_NOT_FOUND) {
        return null;
      }
      // Be more precise and throw errors
      return Promise.reject("Error occurred");
    }
  }

  public async getObject(key: string): Promise<string> {
    try {
      const getResponse: OctokitGetEndpoint["response"] = await this.getObjectOctokit(key);
      const { content } = getResponse.data as any;

      return this.convertBase64ToString(content);
    } catch (error) {
      if (!isApiError(error)) return Promise.reject("Unknown error occured");

      const { message } = error;
      if (message === HTTP_NOT_FOUND) {
        return Promise.reject("Object not found");
      }
      // Be more precise and throw errors
      return Promise.reject("Error occurred");
    }
  }

  private async deleteObjectOctokit(
    key: string,
    sha: string
  ): Promise<OctokitDeleteEndpoint["response"]> {
    try {
      return this.octokit.request(
        `DELETE /repos/{owner}/{repo}/contents/{path}`,
        {
          owner: this.owner,
          repo: this.repo,
          path: key,
          sha: sha,
          ...(this.committer && {
            committer: this.committer,
          }),
          message: `Delete made at ${new Date().getTime()}.`,
        }
      );
    } catch (error) {
      throw error;
    }
  }

  private async getObjectOctokit(
    key: string
  ): Promise<OctokitGetEndpoint["response"]> {
    try {
      return this.octokit.request(`GET /repos/{owner}/{repo}/contents/{path}`, {
        owner: this.owner,
        repo: this.repo,
        path: key,
      });
    } catch (error) {
      throw error;
    }
  }

  private async replaceObjectOctokit(
    key: string,
    value: string,
    sha: string
  ): Promise<boolean> {
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

  private async uploadNewObjectOctokit(
    key: string,
    value: string
  ): Promise<boolean> {
    try {
      await this.octokit.request(
        `PUT /repos/{owner}/{repo}/contents/{path}`,
        {
          ...this.generateUploadParams(key, value),
          message: `Added at ${new Date().getTime()}.`,
        }
      );
    } catch (error) {
      return false;
    }
    return true;
  }

  private validateKey(key: string): boolean {
    // Is this greedy?
    const pathRegEx = /^(\/?[\w-]+)+(\.\w+)?$/;
    if (!pathRegEx.test(key))
      throw new Error("Bad key, please make sure it is a valid path.");
    return true;
  }

  private convertStringToBase64(value: string): string {
    return Buffer.from(value).toString("base64");
  }

  private convertBase64ToString(value: string): string {
    return Buffer.from(value, "base64").toString("ascii");
  }

  private generateUploadParams(path: string, value: string): any {
    return {
      owner: this.owner,
      repo: this.repo,
      path: path,
      message: `Update made at ${new Date().getTime()}.`,
      ...(this.committer && {
        committer: this.committer,
      }),
      content: this.convertStringToBase64(value),
    };
  }
}

