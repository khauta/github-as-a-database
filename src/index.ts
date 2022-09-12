import { GHClient } from './GHClient';

const db = new GHClient({
  owner: 'kozr',
  repo: 'kozr',
  personalAccessToken: process.env.GITHUB_ACCESS_TOKEN as string,
});

db.putObject('demo', 'demo text').then(e => {
  return db.removeObject('demo')
}).catch(e => {
  debugger
})