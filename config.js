export const data = {
  singleRun: false, // if true - `testPlanOrRunId` is a test run ID, else it is a test plan ID
  testPlanOrRunId: '',
  runsToExclude: ['Critical Path', '1st'], // part of the name is enough (ignore if `singleRun` = true)
  projectsToExclude: ['FAT'],
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