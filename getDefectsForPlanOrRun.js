import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  data,
  testRailAuth,
  jiraAuth,
  testRailBaseUrl,
  jiraBaseUrl
} from './config.js';

let auth;
const defectIds = [];
const issuesData = [];
const affectedTestCounts = [];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getRunsForPlan() {
  axios.defaults.baseURL= testRailBaseUrl;
  auth = testRailAuth;
  const runIds = [];

  const response = await axios({
    method: 'get',
    url: `/get_plan/${data.testPlanOrRunId}`,
    auth,
  });
  response.data.entries.forEach(entry => {
    if (data.runsToExclude.every(text => !entry.runs[0].name.includes(text))) {
      runIds.push(entry.runs[0].id);
    }
  });
  return runIds;
}

async function getDefectsForRun(runId) {
  axios.defaults.baseURL= testRailBaseUrl;
  auth = testRailAuth;
  let next = true;
  let url = `/get_results_for_run/${runId}`;
  const allResults = [];
  const lastResults = [];

  while (next) {
    const response = await axios({
      method: 'get',
      url,
      auth,
    });
    allResults.push(...response.data.results);

    next = response.data._links.next;
    if (next) url = next.split('/v2')[1];
  }

  allResults.forEach(result => {
    const matchingResults = allResults.filter(res => res.test_id === result.test_id && res.status_id);
    if (matchingResults.every(matchingResult => matchingResult.created_on <= result.created_on)) {
      if (!data.statusesToExclude.includes(result.status_id)) lastResults.push(result);
    }
  });

  const cleanedLastResults = lastResults
  .filter(result => !!result.defects)
  .map(result => {
    let cleanedResult = {...result};
    cleanedResult.defects = result.defects.toUpperCase().replace(/[^A-Z-0-9,]/g, '');
    return cleanedResult;
  });

  const allDefectIds = cleanedLastResults.map(result => result.defects);
  allDefectIds.forEach((defectId, index) => {
    if(defectId.includes(',')) {
      const separatedIds = defectId.split(',').filter(id => id);
      allDefectIds[index] = separatedIds[0];
      for (let i = 1; i < separatedIds.length; i++) {
        allDefectIds.push(separatedIds[i]);
      }
    }
  });
  allDefectIds.forEach((defectId, index) => {
    if (defectId.includes('NETBROWSE')) {
      allDefectIds[index] = defectId.split('BROWSE').pop();
      defectId = defectId.split('BROWSE').pop();
    }
    if (!defectIds.includes(defectId) 
        && data.projectsToExclude.every(project => defectId.split('-')[0] !== project)) {
      defectIds.push(defectId);
    }
  });

  defectIds.forEach((defectId, index) => {
    const testCount = cleanedLastResults
      .filter(result => result.defects.includes(defectId)).length;
    if (!affectedTestCounts[index]) affectedTestCounts[index] = 0;
    affectedTestCounts[index] += +testCount;
  });

  if (data.singleRun) printDefectIds();
}

async function getDefectsForPlan() {
  const runIds = await getRunsForPlan();

  for (const runId of runIds) {
    await getDefectsForRun(runId);
  };

  printDefectIds();
}

function printDefectIds() {
  defectIds.forEach((defectId, index) => console.log(`${defectId}  -> ${affectedTestCounts[index]}`));
  console.log(`-------------------\nTOTAL DEFECTS: ${defectIds.length}`);
}

async function getIssuesData(issueIds) {
  axios.defaults.baseURL= jiraBaseUrl;
  auth = jiraAuth;
  let next = true;
  let startAt = 0;

  if (!issueIds.length) {
    console.log(`No referenced issues found for test ${data.singleRun ? 'run' : 'plan'} ${data.testPlanOrRunId}`);
    return;
  }

  issueIds = issueIds.filter(id => /^[A-Z]+-\d+$/.test(id));

  while (next) {
    let response;
      response = await axios({
        method: 'post',
        url: '/search',
        data: {
          fields: [
            'priority',
            'status',
            'customfield_10057',
            'summary',
            'name',
            'issuetype'
          ],
          jql: `key in (${issueIds.join(', ')})`,
          startAt,
          maxResults: 100,
        },
        auth,
      });
    if (response.data.issues.length) response.data.issues.forEach(issue => {
      const link = `${jiraBaseUrl.split('/rest')[0]}/browse/${issue.key}`;
      issuesData.push({
        id: issue.key,
        affectedTests: -1,
        priority: issue.fields.priority.name,
        status: issue.fields.status.name,
        devTeam: issue.fields.customfield_10057 ? issue.fields.customfield_10057.value : 'N/A',
        summary: issue.fields.summary,
        type: issue.fields.issuetype.name,
        link,
        oldId: '',
      });
    });

    startAt += 100;
    if (response.data.issues.length < 100) next = false;
  }

  for (const [index, defectId] of defectIds.entries()) {
    let targetIndex = issuesData.findIndex(issueData => defectId === issueData.id);
    if (targetIndex < 0) {
      let response;
      try {
        response = await axios({
          method: 'get',
          url: `/issue/${defectId}`,
          auth,
        });
      } catch (error) {
        console.log(`Could not find such issue in Jira: "${defectId}"`);
        continue;
      }
      const issueIndex = issuesData.findIndex(issueData => issueData.id === response.data.key);
      defectIds[index] = issuesData[issueIndex].id;
      if (issuesData[issueIndex].oldId) issuesData[issueIndex].oldId += `, ${defectId}`
      else issuesData[issueIndex].oldId = defectId;
      targetIndex = issueIndex;
    }
    if (issuesData[targetIndex].affectedTests >= 0) issuesData[targetIndex].affectedTests = `${+issuesData[targetIndex].affectedTests + affectedTestCounts[index]}`;
    else issuesData[targetIndex].affectedTests = `${affectedTestCounts[index]}`;
  };

  printCountsByPriority();
}

async function printCountsByPriority() {
  const foundPriorities = issuesData.map(issue => issue.priority);
  const uniquePriorities = [];
  const priorityCounts = [];
  let outputString = '';
  foundPriorities.forEach(priority => {
    if(!uniquePriorities.includes(priority)) uniquePriorities.push(priority);
  });
  uniquePriorities.sort();
  uniquePriorities.forEach(priority => {
    priorityCounts.push(issuesData.filter(issueData => issueData.priority === priority).length);
  });
  uniquePriorities.forEach((priority, index) => outputString += `${priority}: ${priorityCounts[index]}, `);
  console.log(`(${outputString.slice(0, -2)})`);
}

async function saveIssuesData() {
  let fileString = '';
  const filename = `issues_for_test_${data.singleRun ? 'run' : 'plan'}_${data.testPlanOrRunId}.csv`;
  if (!issuesData.length) return;

  issuesData.sort((a, b) => {
    if (+a.affectedTests > +b.affectedTests) return -1;
    if (+a.affectedTests < +b.affectedTests) return 1;
    return 0;
  });

  fileString += Object.keys(issuesData[0]).join(',');
  issuesData.forEach((item) => {
    if (item.affectedTests < 0) item.affectedTests = 'N/A';
    const values = Object.values(item);
    values.forEach((value, index) => {
      if (value.includes('\"')) values[index] = value.replaceAll('\"', '\"\"');
    })
    fileString += '\n"' +  values.join('","') + '"'
  })
  await fs.writeFile(path.join(__dirname, `/output/${filename}`), fileString, {encoding: "utf8"}, (err) => {
    if (err)
      console.log(err);
    else {
      console.log(`\nIssues saved to "${filename}".`);
    }
  });
}

(async () => {
  if (data.singleRun) await getDefectsForRun(data.testPlanOrRunId);
  else await getDefectsForPlan();
  await getIssuesData(defectIds);
  await saveIssuesData();
})()
