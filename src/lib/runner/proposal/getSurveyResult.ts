import { ProposalResult, SurveyResult } from "./type";

export function getSurveyResult({
  input,
  result: { prev, updated },
}: ProposalResult) {
  const result: SurveyResult = {
    ...input,
    prev: {
      ...input.prev,
      coverage: prev.coverage,
      tests: Object.keys(prev.testCases).length,
    },
    updated: {
      ...input.updated,
      coverage: updated.coverage,
      tests: Object.keys(updated.testCases).length,
    },
    testCases: {
      change: 0,
      insert: 0,
      delete: 0,
      unchanged: 0,
    },
    otherCodes: {
      change: 0,
      delete: 0,
      unchanged: 0,
    },
    isBreaking: false,
  };
  for (const [prevLabel, prevBody] of Object.entries(prev.testCases)) {
    if (prevLabel in updated.testCases) {
      const key =
        prevBody == updated.testCases[prevLabel] ? "unchanged" : "change";
      result.testCases[key] += 1;
    } else {
      result.testCases.delete += 1;
    }
  }
  for (const breakingLabel of Object.keys(updated.testCases)) {
    if (!(breakingLabel in prev.testCases)) {
      result.testCases.insert += 1;
    }
  }
  for (const [prevPath, prevOtherCode] of Object.entries(prev.otherCodes)) {
    if (prevPath in updated.otherCodes) {
      const key =
        prevOtherCode == updated.otherCodes[prevPath] ? "unchanged" : "change";
      result.otherCodes[key] = 1;
    } else {
      result.otherCodes.delete += 1;
    }
  }
  result.isBreaking =
    result.otherCodes.change >= 1 ||
    result.otherCodes.delete >= 1 ||
    result.testCases.change >= 1 ||
    result.testCases.delete >= 1;
  return result;
}
