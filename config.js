export const data = {
  singleRun: false, // if true - `testPlanOrRunId` is a test run ID, else it is a test plan ID
  testPlanOrRunId: '2666',
  runsToExclude: ['Auto'], // part of the name is enough (ignore if `singleRun` = true)
  projectsToExclude: ['FAT'],
  statusesToExclude: [ // ignore test cases with these statuses when gathering defect IDs 
    8, // Deferred
    9, // Deferred Hot Fix
    10, // Not Applicable
    7 // Claimed
  ]
}

export const testRailAuth = {
  username: '',
  password: '',
};

export const jiraAuth = {
  username: '',
  password: '',
};

export const testRailBaseUrl = 'https://foliotest.testrail.io/index.php?/api/v2';
export const jiraBaseUrl = 'https://folio-org.atlassian.net/rest/api/3';