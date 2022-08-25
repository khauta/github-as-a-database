import { GHClient } from '../src/GHClient';

const db = new GHClient({
  owner: process.env.GITHUB_USER_NAME || '',
  repo: process.env.DATABASE_REPO_NAME || '',
  personalAccessToken: process.env.GITHUB_ACCESS_TOKEN as string,
});

db.putObject('test0', '').then((e) => {
  db.putObject('test1/hi', '').then((e) => {
    db.putObject('test1/test0.txt', '').then((e) => {
      db.listObjects('test1/t*')
        .then((listOfObjects) => {
          listOfObjects.forEach((object) => {
              // if (object.name.startsWith('t')) {
                console.log(object.name);
                console.log(object.path);
                console.log(object.sha);
                db.removeObject(object.path).catch((e) => {
                  console.log(e);
                });
              // }
          });
        })
        .catch((e) => {
          debugger;
        });
    });
  });
});
