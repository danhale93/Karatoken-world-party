const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  projectName: 'Karatoken World Party',
  repo: 'danhale93/ultrastar-worldparty',
  columns: ['Backlog', 'To Do', 'In Progress', 'Review', 'Testing', 'Done'],
  labels: [
    { name: 'P0: Critical', color: 'd73a4a', description: 'Critical path (blocking)' },
    { name: 'P1: High', color: 'ff9f1c', description: 'High priority' },
    { name: 'P2: Medium', color: 'ffd33d', description: 'Medium priority' },
    { name: 'P3: Low', color: '0e8a16', description: 'Low priority' },
    { name: 'bug', color: 'd73a4a', description: 'Something isn\'t working' },
    { name: 'enhancement', color: 'a2eeef', description: 'New feature or request' },
    { name: 'documentation', color: '0075ca', description: 'Improvements to documentation' },
  ],
  initialMilestones: [
    { title: 'Core Features', description: 'Basic functionality implementation' },
    { title: 'AI Integration', description: 'AI-powered genre swapping' },
    { title: 'Mobile Experience', description: 'React Native mobile app' },
  ],
  initialIssues: [
    {
      title: 'Set up local development environment',
      body: 'Create and document local development setup with all dependencies',
      labels: ['P0: Critical', 'enhancement'],
      milestone: 'Core Features'
    },
    {
      title: 'Implement basic genre swap API',
      body: 'Create API endpoint for genre swapping functionality',
      labels: ['P0: Critical', 'enhancement'],
      milestone: 'Core Features'
    },
    {
      title: 'Create web UI for genre swapping',
      body: 'Build responsive web interface for the genre swap feature',
      labels: ['P1: High', 'enhancement'],
      milestone: 'Core Features'
    },
    {
      title: 'Set up CI/CD pipeline',
      body: 'Configure GitHub Actions for automated testing and deployment',
      labels: ['P1: High', 'enhancement'],
      milestone: 'Core Features'
    },
  ]
};

// Utility functions
function runCommand(command) {
  try {
    return execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    process.exit(1);
  }
}

function gh(command) {
  return runCommand(`gh ${command}`);
}

async function setupGitHubProject() {
  console.log('Setting up GitHub project...');
  
  // Create project
  console.log('Creating project...');
  const projectCreateCmd = `gh project create "${CONFIG.projectName}" --owner ${CONFIG.repo.split('/')[0]} --repo ${CONFIG.repo.split('/')[1]} --format json`;
  const projectOutput = JSON.parse(execSync(projectCreateCmd, { stdio: 'pipe' }).toString());
  const projectId = projectOutput.id;
  
  console.log(`Created project with ID: ${projectId}`);
  
  // Create columns
  console.log('Creating columns...');
  for (const column of CONFIG.columns) {
    gh(`project column-create ${projectId} "${column}"`);
  }
  
  // Create labels
  console.log('Creating labels...');
  for (const label of CONFIG.labels) {
    gh(`api --method POST /repos/${CONFIG.repo}/labels -f name="${label.name}" -f color="${label.color}" -f description="${label.description}"`);
  }
  
  // Create milestones
  console.log('Creating milestones...');
  for (const milestone of CONFIG.initialMilestones) {
    gh(`api --method POST /repos/${CONFIG.repo}/milestones -f title="${milestone.title}" -f description="${milestone.description}"`);
  }
  
  // Create issues and add to project
  console.log('Creating initial issues...');
  for (const issue of CONFIG.initialIssues) {
    const labels = issue.labels.map(l => `-l "${l}"`).join(' ');
    const milestoneCmd = issue.milestone ? `--milestone "${issue.milestone}"` : '';
    const createCmd = `gh issue create --title "${issue.title}" --body "${issue.body}" ${labels} ${milestoneCmd}`;
    
    const issueOutput = execSync(createCmd, { stdio: 'pipe' }).toString();
    const issueNumber = issueOutput.match(/pull\/(\d+)/)?.[1];
    
    if (issueNumber) {
      gh(`project item-add ${projectId} --url ${issueOutput.trim()}`);
    }
  }
  
  console.log('Project setup complete!');
}

// Main execution
async function main() {
  try {
    // Verify GitHub CLI is installed and authenticated
    try {
      execSync('gh --version', { stdio: 'ignore' });
      await setupGitHubProject();
    } catch (error) {
      console.error('GitHub CLI is not installed or not authenticated.');
      console.log('Please install GitHub CLI from: https://cli.github.com/');
      console.log('Then authenticate using: gh auth login');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error setting up project:', error);
    process.exit(1);
  }
}

main();
