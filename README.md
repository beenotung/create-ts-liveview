# create-ts-liveview

npm init cli script to create [ts-liveview](https://github.com/beenotung/ts-liveview/tree/v4) project

[![npm Package Version](https://img.shields.io/npm/v/create-ts-liveview)](https://www.npmjs.com/package/create-ts-liveview)

## How this works

This package is a `npm init` script. You can run any 'create-X' package by running 'npm init X'.

It takes an optional argument to specify the project name (following the naming format of npm package, no space, no uppercase, e.t.c.)

It downloads the template project using degit. Compared with pulling from git directly, you don't need to download the full commit history, hence it loads faster.

## Usage example
```bash
# reuse cached version if available
> npm init ts-liveview my-app
# or always run the latest version of cli package
> npx create-ts-liveview my-app
```
Then follows the "get started" message from above command.

**Remark**:
Sometimes "npm init X" get stuck on old version of 'create-X' package, you may run "npx create-X" to run the latest version of cli package.

This issue is discussed on https://github.com/npm/cli/issues/2395

## License
This is free and open-source software (FOSS) with
[BSD-2-Clause License](./LICENSE)
