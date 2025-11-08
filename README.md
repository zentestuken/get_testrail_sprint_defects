# Purpose
Retrieves defects data for a FOLIO Testrail test plan/run fetching defect details from FOLIO Jira.

Provides counts of affected test cases for each defect.

# Requirements
Node.js 18+

# Install
`npm i`

# Configuration
Fill run parameters and credentials in `config.js`
- `testPlanOrRunId` - ID of the test plan or test run to get defects from (ignored if ID provided as CLI argument)
- `runsToExclude` - which test runs (full/partial names) to ignore when retrieving data for a test plan
- `projectsToExclude` - defects for which Jira projects to ignore
- `statusesToExclude` - test cases with these statuses will be ignored

# Run
`npm run getdefects`   _(test plan/run ID from config.js will be used)_

OR

`npm run getdefects 1234`   _(specify ID directly; provided ID overrides the one in config.js)_

# Output
Results are saved as a CSV file in `/output` directory.
