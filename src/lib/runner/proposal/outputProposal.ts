import path from "path";

import { safeWriteFileSync, outputDir, convertJsonToCSV } from "../../utils";
import { getSurveyResult } from "./getSurveyResult";
import { ProposalResult } from "./type";

export function outputProposal(proposalResults: ProposalResult[]) {
  const surveyResults = proposalResults.map(getSurveyResult);
  safeWriteFileSync(
    path.join(outputDir, "proposal_result.json"),
    JSON.stringify(surveyResults, null, 2)
  );
  safeWriteFileSync(
    path.join(outputDir, "proposal_result.csv"),
    convertJsonToCSV(surveyResults)
  );
}
