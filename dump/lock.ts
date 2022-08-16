// private readonly MAX_LOCK_ATTEMPTS = 25;

// private async addLockOctokit(key: string): Promise<string> {
//   try {
//     const response = await this.octokit.request(`PUT /repos/{owner}/{repo}/contents/{path}`, {
//       ...this.generateUploadParams(`${key}/&lock`, ''),
//       message: `Locked at ${new Date().getTime()}.`,
//     });
//     const sha = response.data.content!.sha as string
//     return sha
//   } catch (error) {
//     throw new Error('Lock exists.')
//   }
// }

// private async removeLockOctokit(key: string, sha: string): Promise<OctokitDeleteEndpoint['response']> {
//   try {
//     return this.octokit.request(`DELETE /repos/{owner}/{repo}/contents/{path}`, {
//       owner: this.owner,
//       repo: this.repo,
//       path: `${key}/&lock`,
//       sha: sha,
//       ...(this.committer && {
//         committer: this.committer,
//       }),
//       message: `Lock removed at ${new Date().getTime()}.`,
//     });
//   } catch (error) {
//     throw error;
//   }
// }

// private async withLock(key: string, callback: any, ...args: string[]) {
//   let remainingAttempts = this.MAX_LOCK_ATTEMPTS

//   while (remainingAttempts > 0) {
//     try {
//       const sha = await this.addLockOctokit(key)
//       await callback.apply(args)
//       await this.removeLockOctokit(key, sha)
//       return 
//     } catch (error) {
//       await sleep(25)
//     }
//   }
//   throw new Error('Lock timeout.')
// }