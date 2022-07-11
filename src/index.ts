import { GHBlobStorageConnection } from "./GHBlobStorageConnection"
import { Octokit } from "@octokit/rest";

const db = new GHBlobStorageConnection({
  owner: 'kozr',
  repo: 'kozr',
  personalAccessToken: process.env.GITHUB_ACCESS_TOKEN as string
});

db.uploadObject('test.txt', 'test').catch((e) => {
  debugger
}).then((e) => {
  debugger
})
