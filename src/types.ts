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
