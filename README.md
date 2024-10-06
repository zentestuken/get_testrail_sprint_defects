# Purpose
Retrieves defects data for a FOLIO Testrail test plan/run fetching defect details from FOLIO Jira.

# Requirements
Node.js 18+

# Install
`npm i`

# Configuration
Fill run parameters and credentials in `config.js`
- `singleRun` - get results for a single test run instead of a test plan
- `runsToExclude` - which test runs to ignore when retrieving data for a test plan
- `projectsToExclude` - defects for which Jira projects to ignore
