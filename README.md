# GitHub As A Database (WIP)

The goal of the project is to use GitHub repos as unstructured data storage for rapid prototyping, courtesy of GitHub servers.

### To initialize
Specify owner, and repo name, and a personal GitHub access token with (for example) `public:repo` enabled
```
import { GHClient } from './GHClient';

const db = new GHClient({
  owner: 'kozr',
  repo: 'kozr',
  personalAccessToken: GITHUB_ACCESS_TOKEN_HERE,
});
```

## Methods

### putObject
parameter 0: `key: string`, name of the object you wish to add. \
parameter 1: `content: string`, content you wish to store.\
returns: `Promise<void>`\
throws error on fail
```
db.putObject('demo', 'demo text')
```

### removeObject
parameter: `key: string`, name of the object you wish to remove. \
returns: `Promise<void>`\
throws error on fail
```
db.removeObject('demo')
```

### getObject
parameter: `key: string`, name of the object you wish to retrieve. \
returns: `Promise<string>`, content of the object you retrieved. \
throws error on fail
```
db.getObject('demo')
```


### listObjects
parameter: \
returns: \
throws error on fail
```
db.listObjects('*')
```
