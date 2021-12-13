import { ProposalResult as ProposalResultItem } from "../../../../runner-proposal/src/type";

export { ProposalResultItem };

export type Revision = {
  version: string;
  hash: string;
};

export type ProposalInput = {
  nameWithOwner: string;
  npm_pkg: string;
  state: string;
  stats: {
    failure: number;
    success: number;
  };
  updated: Revision;
  prev: Revision;
};

export type SurveyResult = ProposalInput & {
  prev: Revision & {
    tests: number;
    coverage: any;
  };
  updated: Revision & {
    tests: number;
    coverage: any;
  };
  testCases: {
    change: number;
    insert: number;
    delete: number;
    unchanged: number;
  };
  otherCodes: {
    change: number;
    delete: number;
    unchanged: number;
  };
  isBreaking: boolean;
};

export type ProposalResult = {
  input: ProposalInput;
  result: {
    prev: ProposalResultItem;
    updated: ProposalResultItem;
  };
};
