SELECT
  pr.npm_pkg S__npm_pkg,
  pd.nameWithOwner S__nameWithOwner,
  pd.commit_id S__commit_id,
  pd.dependency L__npm_pkg,
  ar.repo__nameWithOwner L__nameWithOwner,
  pd.commit_version L__commit_version
FROM pkg_dependencies pd
  INNER JOIN analysis_result ar
    ON pd.dependency=ar.repo__npm_pkg
    AND ar.data__success_run_rate="1"
  INNER JOIN pkg_repositories pr
    ON pd.nameWithOwner=pr.nameWithOwner
    AND pr.hasTestScript="1"
WHERE pd.type="pro"
GROUP BY S__nameWithOwner, L__npm_pkg
