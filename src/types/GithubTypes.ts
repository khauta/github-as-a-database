import { Endpoints } from '@octokit/types';

export type OctokitGetEndpoint = Endpoints['GET /repos/{owner}/{repo}/contents/{path}'];

// type OctokitGetEndpointData =
//   Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]['response']['data'];

export type OctokitGetEndpointData = {
  type: string;
  encoding: string;
  size: number;
  name: string;
  path: string;
  content?: string | undefined;
  sha: string;
  url: string;
};

export type OctokitDeleteEndpoint = Endpoints['DELETE /repos/{owner}/{repo}/contents/{path}'];
