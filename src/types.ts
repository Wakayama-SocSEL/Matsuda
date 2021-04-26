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
type DatasetRepository = {
  npm_pkg: string;
  language_name: string;
  releases_count: number;
  issues_count: number;
  pullRequests_count: number;
  stargazers_count: number;
  watchers_count: number;
  nameWithOwner: string;
  pushedAt: string;
  updatedAt: string;
  createdAt: string;
  isFork: string;
  forkCount: number;
  isArchived: string;
  isMirror: string;
  isLocked: string;
  id: string;
  databaseId: number;
  parent_nameWithOwner: string;
  commits_count: number;
  commits_dependencies_count: number;
  contributors_count: number;
  readmeSize: number;
  testsSize: number;
  license: string;
  hasTestScript: string;
  hasSelectiveFiles: string;
  npm_starsCount: number;
  carefulness: number;
  tests: number;
  health: number;
  branding: number;
  communityInterest: number;
  downloadsCount: number;
  downloadsAcceleration: number;
  dependentsCount: number;
  releasesFrequency: number;
  commitsFrequency: number;
  openIssues: number;
  issuesDistribution: number;
  quality: number;
  popularity: number;
  maintenance: number;
  npms_score: number;
};
