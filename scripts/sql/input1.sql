SELECT
  npm_pkg,
  nameWithOwner,
  hasTestScript,
  npms_score
FROM pkg_repositories
  WHERE hasTestScript=1
  ORDER BY npms_score DESC
