const core = require('@actions/core')
async function run() {

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

     core.info('I am  a JS Action')




}

run()


