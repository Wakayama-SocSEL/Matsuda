const testResults = require("../../output/test_result.json");

function getUpdates(results) {
  const updates = [];
  for (let index = 1; index < results.length; index++) {
    const prev = results[index - 1];
    const updated = results[index];
    if (
      prev.L__nameWithOwner == updated.L__nameWithOwner &&
      prev.S__nameWithOwner == updated.S__nameWithOwner
    ) {
      updates.push({
        nameWithOwner: prev.L__nameWithOwner,
        npm_pkg: prev.L__npm_pkg,
        state: updated.state,
        updated: {
          version: updated.L__version,
          hash: updated.L__hash,
        },
        prev: {
          version: prev.L__version,
          hash: prev.L__hash,
        },
      });
    }
  }
  return updates;
}

function aggregateUpdates(updates) {
  const results = [];
  for (const update of updates) {
    const sameUpdate = results.find(
      (result) =>
        result.nameWithOwner == update.nameWithOwner &&
        result.updated.version == update.updated.version &&
        result.prev.version == update.prev.version
    );
    if (!sameUpdate) {
      results.push({
        ...update,
        stats: {
          failure: update.state == "failure" ? 1 : 0,
          success: update.state == "success" ? 1 : 0,
        },
      });
    } else {
      sameUpdate.stats[update.state] += 1;
      if (update.state == "failure") {
        sameUpdate.state = "failure";
      }
    }
  }
  return results;
}

const updates = getUpdates(testResults);
const output = aggregateUpdates(updates);
console.log(JSON.stringify(output, null, 2));
