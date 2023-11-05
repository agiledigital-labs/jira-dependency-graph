# Jira Dependency Graph
This project contains a Forge app written in Javascript that visualises "Blocker" relationships between subtasks.
![image](https://github.com/agiledigital-labs/jira-dependency-graph/assets/1272682/d6f25b7e-030e-4bd1-992a-672e8af94752)

See [developer.atlassian.com/platform/forge/](https://developer.atlassian.com/platform/forge) for documentation and tutorials explaining Forge.

## Requirements

See [Set up Forge](https://developer.atlassian.com/platform/forge/set-up-forge/) for instructions to get set up.

## Quick start

- Install top-level dependencies:
```
npm install
```

- Install dependencies inside of the `static/issue-graph-panel` directory:
```
npm install
```

- Modify your app by editing the files in `static/issue-graph-panel/src/`.

- Build your app (inside of the `static/issue-graph-panel` directory):
```sh
npm run build
# Or watch for changes
npm run build -- --watch 
```

- Deploy your app by running:
```
forge deploy
```

- Install your app in an Atlassian site by running:
```
forge install
```

### Notes
- Use the `forge deploy` command when you want to persist code changes.
- Use the `forge install` command when you want to install the app on a new site.
- Once the app is installed on a site, the site picks up the new app changes you deploy without needing to rerun the install command.

## Support

See [Get help](https://developer.atlassian.com/platform/forge/get-help/) for how to get help and provide feedback.
