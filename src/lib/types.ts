import { Octokit } from "@octokit/core";

export type RepoName = `${string}/${string}`;

export type RepoInfo = {
  repo: DatasetRepository;
  versions: {
    [name: string]: string;
  };
};

export type RepoError = {
  repo: DatasetRepository;
  err: string;
};

type PromiseType<T extends Promise<any>> = T extends Promise<infer P>
  ? P
  : never;

export type ApiResponses = {
  [version: string]: PromiseType<ReturnType<Octokit["request"]>>;
};

export type RepoResult = {
  repo: DatasetRepository;
  apiResponses: ApiResponses;
};

// pkg_repositories.csv
export type DatasetRepository = {
  npm_pkg: string;
  nameWithOwner: RepoName;
  hasTestScript: string;
  npms_score: number;
};
