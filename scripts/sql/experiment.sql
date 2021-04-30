SELECT
  d.nameWithOwner S__nameWithOwner,
  d.commit_id S__commit_id,
  d.dependency L__npm_pkg,
  r.repo__nameWithOwner L__nameWithOwner,
  r.repo__npms_score L__npms_score
FROM pkg_dependencies d
  INNER JOIN analysis_result r
    ON d.dependency = r.repo__npm_pkg
    AND r.data__success_run_rate="1"
GROUP BY S__nameWithOwner, L__npm_pkg
