export const data = {
  // ID of the test plan or test run to get defects from.
  // Ignored if ID is passed as a command line argument: `npm run getdefects 1234`
  testPlanOrRunId: '',
  runsToExclude: ['Auto'], // part of the name is enough (not used if working with a single test run)
  projectsToExclude: ['FAT'], // ignore issues from these Jira projects
  statusesToExclude: [ // ignore test cases with these statuses when gathering referenced defects 
    1, // Passed
    // 8, // Deferred
    // 9, // Deferred Hot Fix
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
