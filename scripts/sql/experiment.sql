WITH input AS (
SELECT
  ar.repo__nameWithOwner L__nameWithOwner,
  pd.dependency L__npm_pkg,
  pd.commit_version L__commit_version,
  pd.nameWithOwner S__nameWithOwner,
  pr.npm_pkg S__npm_pkg,
  pd.commit_id S__commit_id
FROM pkg_dependencies pd
  INNER JOIN analysis_result ar
    ON pd.dependency=ar.repo__npm_pkg
    AND ar.data__success_run_rate="1"
  INNER JOIN pkg_repositories pr
    ON pd.nameWithOwner=pr.nameWithOwner
    AND pr.hasTestScript="1"
WHERE pd.type="pro"
GROUP BY S__nameWithOwner, L__nameWithOwner
)
SELECT a.*, b.S__count
FROM input a
INNER JOIN (
  SELECT L__nameWithOwner, COUNT(S__nameWithOwner) S__count
  FROM input
  GROUP BY L__nameWithOwner
  ORDER BY S__count
  LIMIT 10
) b
  ON a.L__nameWithOwner=b.L__nameWithOwner
ORDER BY S__count
