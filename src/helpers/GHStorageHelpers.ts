import { GithubError } from '../types/ErrorTypes';

export const isGithubApiError = (x: any): x is GithubError => {
  return typeof x.status === 'number';
};

export const validStorageKey = (key: string): boolean => {
  // Is this greedy?
  const pathRegEx = /^(\/?[\w-]+)+(\.\w+)?$/;
  return pathRegEx.test(key);
};

export const convertStringToBase64 = (value: string): string => {
  return Buffer.from(value).toString('base64');
};

export const convertBase64ToString = (value: string): string => {
  return Buffer.from(value, 'base64').toString('ascii');
};
