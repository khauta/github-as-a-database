import { GHClient } from '../src/GHClient';

const db = new GHClient({
  owner: process.env.GITHUB_USER_NAME || '',
  repo: process.env.DATABASE_REPO_NAME || '',
  personalAccessToken: process.env.GITHUB_ACCESS_TOKEN as string,
});

db.putObject('DisappearingFiles/FirstDisappearingFile', '').then((e) => {
  db.putObject('DisappearingFiles/SecondDisappearingFile', '').then((e) => {
    db.listObjects('DisappearingFiles/F*')
      .then((listOfObjects) => {
        return Promise.all(
          listOfObjects.map((object) => {
            console.log('Removing', object.path);
            return db.removeObject(object.path);
          })
        );
      })
      .then(() => {
        db.listObjects('DisappearingFiles/F*').then((listOfObjects) => {
          if (listOfObjects.length > 0) debugger;
          db.listObjects('DisappearingFiles/Second*').then((listOfObjects) => {
            if (listOfObjects.length !== 1) debugger;
            return Promise.all(
              listOfObjects.map((object) => {
                console.log('Removing', object.path);
                return db.removeObject(object.path);
              })
            );
          });
        });
      })
      .then(() => {
        db.removeObject('DisappearingFile').catch((e) => {
          console.error(e);
          debugger;
        });
      })
      .catch((e) => {
        console.error(e);
        debugger;
      });
  });
});
