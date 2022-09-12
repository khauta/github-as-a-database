import { GHClient } from '../src/GHClient';

const db = new GHClient({
  owner: process.env.GITHUB_USER_NAME || '',
  repo: process.env.DATABASE_REPO_NAME || '',
  personalAccessToken: process.env.GITHUB_ACCESS_TOKEN as string,
});

db.putObject('DisappearingFile', '').then(() => {
  db.putObject('DisappearingFiles/SecondDisappearingFile', '').then(() => {
    db.listObjects('DisappearingFile*').then((listOfObjects) => {
      return Promise.all(
        listOfObjects.map((object) => {
          console.log('Removing', object.path);
          return db.removeObject(object.path);
        })
      );
    }).catch(e => {
      console.error(e)
      debugger
    }) 
  });
});
