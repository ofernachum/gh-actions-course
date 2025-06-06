/*
    1. Parse Inputs:
        1.1 base branch for which to chake for updates
        1.2 target-branch to use to create PR
        1.3 GitHub token for authentication (for creating PRs)
        1.4. Working directory for which to check for dependencies

    2. Execute the npm update command within our working directory
    3. Check whether there are modified package*.json files
    4. If there are modified files:
        4.1 Add and commit files to the target-branch
        4.2 Create a PR to the base-branch using the oktokit API
    5. Otherwise conclude the custom action
*/



// Required Node Packages:
const core = require('@actions/core'); //API for base GH Actions functionality:
const exec = require('@actions/exec'); // For executing various git commands (cli)
const github = require('@actions/github'); // Octokit API  - GitHub’s official JavaScript/TypeScript client


//This function checks if branchName contains only the following chars:
const validateBranchName = ({ branchName }) => /^[a-zA-Z0-9_\-\.\/]+$/.test(branchName);

//This function checks if directory contains only the following chars:
const validateDirectoryName = ({ dirName }) => /^[a-zA-Z0-9_\-\/]+$/.test(dirName);


async function run() {
    // Get the inputs:
    const baseBranch = core.getInput('base-branch', { required: true });
    const targetBranch = core.getInput('target-branch', { required: true });
    const ghToken = core.getInput('gh-token', { required: true });
    const workingDir = core.getInput('working-directory', { required: true });
    const debug = core.getBooleanInput('debug');


    // Options for exec commands used later on: 
    const commonExecOpts = {
        cwd: workingDir
    }


    //Will ensure the token is protected as secerete and not presented as clear text anywhare:
    core.setSecret(ghToken);

    
    //Use validateBranchName to validate branch name:
    if (!validateBranchName({ branchName: baseBranch })) {
        // Set the action as failed (action will be stopped), log an error message and return:
        core.setFailed('Invalid Base Branch Name !');
        return;
    }

    if (!validateBranchName({ branchName: targetBranch })) {
       // Set the action as failed (action will be stopped), log an error message and return:
        core.setFailed('Invalid Target Branch Name !');
        return;
    }
    //Use validateDirectoryName to validate Working Directory name:
    if (!validateDirectoryName({ dirName: workingDir })) {
        // Set the action as failed (action will be stopped), log an error message and return:
        core.setFailed('Invalid Working Directory Name !');
        return;
    }

    // Print to console:
    core.info(`[js-dependency-update] : base branch is ${baseBranch}`)
    core.info(`[js-dependency-update] : target branch is ${targetBranch}`)
    core.info(`[js-dependency-update] : working directory is ${workingDir}`)

    // Will execute the npm update command within the working directory:
    await exec.exec('npm update', [], {
        ...commonExecOpts
    });

    // Check if package*.json files where changed by the npm update command:
    const gitStatus = await exec.getExecOutput('git status -s package*.json', [], {
        ...commonExecOpts
    });

    // If the output of the previous command is grater than 0 it means there are updates available nad
    // initiate the PR logic:

    if (gitStatus.stdout.length > 0) {
        
        core.info('[js-dependency-update] : There are updates available');
        
        // This for indicating that the commit had been performed by our GH automation:
        await exec.exec(`git config --global user.name "gh-automation"`);
        await exec.exec(`git config --global user.email "gh-automation@email.com"`);
        
        // Create and Checkout the target branch to which we will commit the changes:
        await exec.exec(`git checkout -b ${targetBranch}`, [], {
            ...commonExecOpts
        });

        // Stage the files to be commited (This are the pachage files we want to update)
        // The previous npm update apdated the package.json package-lock.jason files with new versions of packages.
        // So - we want to commit just those so when the application is built again it will use the updated dependencies.
        await exec.exec(`git add package.json package-lock.json`, [], {
            ...commonExecOpts
        });

        // commit the changes into the target branch 
        await exec.exec(`git commit -m "chore: Update Dependencies"`, [], {
            ...commonExecOpts
        });

        //Push to remote repository.  
        await exec.exec(`git push -u origin ${targetBranch} --force"`, [], {
            ...commonExecOpts
        });

        
        // Declare octokit instance and pass the tocken:
        const octokit = github.getOctokit(ghToken) 

        try{

             // Create the pull request: 
            
             await octokit.rest.pulls.create({
                
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                title: `Update NPM Dependencies`,
                body: `This Pull Request updates NPM Packages`,
                base: baseBranch,
                head: targetBranch

                });

        } catch (e) {

            core.error('[js-dependency-update] : Something went wrong while creating the PR. Check logs below.');
            core.error(e.message);
            core.setFailed(e);

        }


    } else {
        core.info('[js-dependency-update] : No updates at this point in time')
    }



    
     core.info('I am  a JS Action')


}

run()


