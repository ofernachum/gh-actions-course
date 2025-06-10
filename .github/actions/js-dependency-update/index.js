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

// This function will be used to set up Git user to reflect the operation of this action
// is done by automation (updating dependencies).
// We call this function later at C101
const setupGit = async () => {
    await exec.exec(`git config --global user.name "gh-automation"`);
    await exec.exec(`git config --global user.email "gh-automation@email.com"`);
};


//This function checks if branchName contains only the following chars:
const validateBranchName = ({ branchName }) => /^[a-zA-Z0-9_\-\.\/]+$/.test(branchName);

//This function checks if directory contains only the following chars:
const validateDirectoryName = ({ dirName }) => /^[a-zA-Z0-9_\-\/]+$/.test(dirName);

// The following Logger function enable us to extend the loggin capabilities
// to other tools ...
// Declared in C40
const setupLogger = ({ debug, prefix } = { debug: false, prefix: ''}) => ({

  
    debug: (message) => {

        if (debug) { core.info(`DEBUG ${ prefix }${ prefix ? ':' : '' }${message}`);}
        // extend the logging funtionality here !
        },

    info: (message) => {

        core.info(`${ prefix }${ prefix ? ':' : '' }${message}`);

    },

    error: (message) => {
        core.error(`${ prefix }${ prefix ? ':' : '' }${message}`);
    }


    
    
});




// This is the main custom action function:
async function run() {
    // Get the inputs:
    const baseBranch = core.getInput('base-branch', { required: true });
    const targetBranch = core.getInput('target-branch', { required: true });
    const ghToken = core.getInput('gh-token', { required: true });
    const workingDir = core.getInput('working-directory', { required: true });
    const debug = core.getBooleanInput('debug');
    
    // Declare a logger defined earlier (C40)
    const logger = setupLogger({debug, prefix: '[js-dependency-update]'});


    // Options for exec commands used later on: 
    const commonExecOpts = {
        cwd: workingDir
    }


    //Will ensure the token is protected as secerete and not presented as clear text anywhare:
    core.setSecret(ghToken);

    
    logger.debug('Validating Inputs - base-branch, target-branch, working-directory');

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

    // Print to console using the logger:
    logger.debug(`base branch is ${baseBranch}`);
    logger.debug(`target branch is ${targetBranch}`);
    logger.debug(`working directory is ${workingDir}`);


    logger.debug(`Checking for package updates`);

    // Will execute the npm update command within the working directory:
    await exec.exec('npm update', [], {
        ...commonExecOpts
    });

    // Check if package*.json files where changed by the npm update command:
    const gitStatus = await exec.getExecOutput('git status -s package*.json', [], {
        ...commonExecOpts
    });

    

    // Setting output to false by defalt (no updates)
    let updatesAvailable = false; 


    // If the output of the previous command is grater than 0 it means there are updates available and
    // initiate the PR logic:
    if (gitStatus.stdout.length > 0) {
        
        // Set Output to true if there are updates availabel
        // This variable is used at the end of this run function to generate the Output (C209)
        updatesAvailable = true;

        
        logger.debug('There are updates available');
        logger.debug('Setting up git');
        
        // This for indicating that the commit had been performed by our GH automation by
        // calling the following function (defined above - C101):
        await setupGit();
        
        logger.debug('Commiting and Pushing package changes');
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

         logger.debug('Fetching Octokit API');
        // Declare octokit instance and pass the tocken:
        const octokit = github.getOctokit(ghToken) 

        try{

             logger.debug(`Creating PR using target branch ${ targetBranch }`);

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


            logger.error('Something went wrong while creating the PR. Check logs below.');
            logger.error(e.message);

            core.error(e.message)
            core.setFailed(e);

        }


    } else {
        logger.info('No updates at this point in time')
    }

    // Setting Action Output to indicate if updates are available. (C209)
    // The name of the Output should match the Output in action.yaml
    logger.debug(`Setting updates-available output to true ${updatesAvailable}`)
    core.setOutput('updates-available', updatesAvailable);

}

run();

