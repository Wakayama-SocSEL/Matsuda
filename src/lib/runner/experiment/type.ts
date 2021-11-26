export type ExperimentInput = {
  S__npm_pkg: string;
  S__nameWithOwner: string;
  S__commit_id: string;
  L__npm_pkg: string;
  L__nameWithOwner: string;
  L__commit_version: string;
};

export type ExperiemntDataset = {
  [L__nameWithOwner: string]: ExperimentInput[];
};

export type DependenciesResult = {
  [npm_pkg: string]: string;
};

export type TestSuccess = {
  state: "success";
  stdout: string;
};

export type TestError = {
  state: "failure";
  err: string;
};

export type TestStatus = TestSuccess | TestError;

export type TestResult = {
  input: ExperimentInput & { L__version: string; L__hash: string };
  status: Pick<TestStatus, "state">;
};
