import { GHBlobStorageConnection } from "./GHBlobStorageConnection"

const db = new GHBlobStorageConnection({
  owner: 'kozr',
  repo: 'kozr',
  personalAccessToken: process.env.GITHUB_ACCESS_TOKEN as string
});

db.removeObject('tessdasdat.txt').catch((e) => {
  debugger
}).then((e) => {
  debugger
})
