export type ExperimentInput = {
  S__npm_pkg: string;
  S__nameWithOwner: string;
  S__commit_id: string;
  S__hasTestScript: string;
  S__testsSize: string;
  L__npm_pkg: string;
  L__commit_version: string;
  L__nameWithOwner: string;
  L__npms_score: string;
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

export type RunTestResult = {
  input: ExperimentInput;
  statuses: TestStatus[];
};
