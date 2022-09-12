import { RESERVED_FILE_KEY } from '../constants/Defaults';
import { GithubError } from '../types/ErrorTypes';

export const isGithubApiError = (x: any): x is GithubError => {
  return typeof x.status === 'number';
};

export const convertStringToBase64 = (value: string): string => {
  return Buffer.from(value).toString('base64');
};

export const convertBase64ToString = (value: string): string => {
  return Buffer.from(value, 'base64').toString('ascii');
};

export const sleep = (ms: number): Promise<NodeJS.Timeout> => {
  return new Promise(resolve => setTimeout(resolve, ms));
}