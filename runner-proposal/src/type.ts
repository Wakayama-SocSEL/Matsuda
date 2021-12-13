export type ProposalResult = {
  coverage: any;
  testCases: {
    [label: string]: string;
  };
  otherCodes: {
    [path: string]: string;
  };
  errors: {
    [path: string]: boolean;
  };
};
