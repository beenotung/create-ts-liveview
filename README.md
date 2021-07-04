# create-ts-liveview

npm init cli script to create ts-liveview project

[![npm Package Version](https://img.shields.io/npm/v/create-ts-liveview.svg?maxAge=3600)](https://www.npmjs.com/package/create-ts-liveview)

## How this works

This package is a `npm init` script. You can run any 'create-X' package by running 'npm init X'.

It takes an optional argument to specify the project name (following the naming format of npm package, no space, no uppercase, e.t.c.)

It downloads the template project using degit. Compared with pulling from git directly, you don't need to download the full commit history, hence it loads faster.

## Usage example
```bash
> npm init ts-liveview my-app
> cd my-app
> pnpm install
> pnpm dev
```

## License
This is free and open-source software (FOSS) with
[BSD-2-Clause License](./LICENSE)
