import { Octokit } from "@octokit/core";

export type RepoName = `${string}/${string}`;

export type RepoInfo = {
  repoName: RepoName;
  versions: {
    [name: string]: string;
  };
};

export type RepoError = {
  repoName: RepoName;
  err: string;
};

type PromiseType<T extends Promise<any>> = T extends Promise<infer P>
  ? P
  : never;

export type RepoStatus = {
  [version: string]: PromiseType<ReturnType<Octokit["request"]>>;
};

// pkg_repositories.csv
export type DatasetRepository = {
  npm_pkg: string;
  nameWithOwner: string;
  hasTestScript: string;
  npms_score: number;
};
