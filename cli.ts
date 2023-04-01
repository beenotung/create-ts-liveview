#!/usr/bin/env node
import { execSync } from 'child_process'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { cloneTemplate, hasExec } from 'npm-init-helper'
import { EOL, userInfo } from 'os'
import { basename, join } from 'path'
import { createInterface } from 'readline'
import { version } from './package.json'

let repoOrg = 'beenotung'
let repoName = 'ts-liveview'
let repo = `${repoOrg}/${repoName}`

let helpMessage = `
create-ts-liveview@${version}

## Usage

 > npx create-ts-liveview
 or
 > npm init ts-liveview

## Options

 --help
   display this help message

 --branch <branch-name>
   specify the branch name of template

 --dest <project-directory>
   specify the destination directory

If the branch or destination are not specified, they will be asked interactively.

## Usage Example

 > npx create-ts-liveview --branch v4 --dest liveview-hn
 or
 > npx create-ts-liveview --branch v4 liveview-hn
 or
 > npx create-ts-liveview liveview-hn
 or
 > npx create-ts-liveview
`.trim()

async function getParams() {
  let branch: string = ''
  let dest: string = ''
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--branch') {
      i++
      branch = process.argv[i]
      continue
    }
    if (process.argv[i] === '--dest') {
      i++
      dest = process.argv[i]
      continue
    }
    if (process.argv[i] === '--help') {
      console.log(helpMessage)
      process.exit(0)
    }
    if (!dest) {
      dest = process.argv[i]
      continue
    }
    console.log({ branch, dest, i, argv: process.argv })
    console.error('unknown argument:', process.argv[i])
    process.exit(1)
  }
  if (!branch || !dest) {
    let iface = createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    function ask(question: string) {
      return new Promise<string>((resolve, reject) => {
        iface.question(question, answer => {
          resolve(answer)
        })
      })
    }
    if (!branch) {
      let branches = ['v5-demo', 'v5-minimal-template', 'v5-auth-template']
      let lines = [
        'Choose a template branch',
        '  Recommended template branches:',
        ...branches.map((name, i) => `    ${i + 1}. ${name}`),
        '  See more branches on: https://github.com/beenotung/ts-liveview/branches',
      ]
      let message = lines.join(EOL)
      while (!branch) {
        console.log(message)
        let input = await ask(`template branch (num/name): `)
        input = input.trim()
        let num = +input
        if (num) {
          branch = branches[num - 1]
          continue
        }
        branch = input
      }
      console.log(`chosen template: ${branch}`)
    }
    while (!dest) {
      dest = await ask('project directory: ')
    }
    iface.close()
  }
  return {
    branch,
    dest,
  }
}

function setupInitScript(dest: string) {
  let file = join(dest, 'scripts', 'init.sh')
  let text = readFileSync(file).toString()
  text = text.replace(/\ninstall="/g, '\n#install="')
  let chosen = hasExec('pnpm') ? 'pnpm' : hasExec('yarn') ? 'yarn' : 'npm'
  console.log('Setting', chosen, 'as installer in', file, '...')
  text = text.replace('#install="' + chosen, 'install="' + chosen)
  writeFileSync(file, text)
}

function setupConfigFile(dest: string, projectName: string) {
  let shortName = projectName.replace(/-server$/, '')
  let file = join(dest, 'scripts', 'config')
  let text = readFileSync(file).toString()
  text = text
    .replace('beenotung/ts-liveview', userInfo().username + '/' + projectName)
    .replace('liveviews', shortName)
    .replace('ts-liveview', shortName)
  writeFileSync(file, text)
}

function setupHelpMessage(dest: string) {
  let helpMessage = execSync(join('scripts', 'help.js'), {
    cwd: dest,
  }).toString()
  writeFileSync(join(dest, 'help.txt'), helpMessage)
}

function setupReadme(input: {
  dest: string
  repoSrc: string
  branch: string
  projectName: string
}) {
  let { dest, repoSrc, branch, projectName } = input
  let readmeUrl = `${repoSrc}/blob/${branch}/README.md`
  let readmeFile = join(dest, 'README.md')
  let readmeText = `# ${projectName}

Powered by [${repoName}](${readmeUrl})

See [help.txt](help.txt) to get started.
`
  writeFileSync(readmeFile, readmeText)
}

function rmFile(file: string) {
  if (existsSync(file)) {
    unlinkSync(file)
  }
}

async function main() {
  let { branch, dest } = await getParams()
  let repoSrc = `https://github.com/${repo}`
  let gitSrc = `${repoSrc}#${branch}`

  console.log(`Copying ${repoName} (${branch}) template to: ${dest} ...`)
  await cloneTemplate({
    gitSrc,
    srcDir: '.',
    dest,
    updatePackageJson: true,
  })

  let projectName = basename(dest)

  setupInitScript(dest)
  setupConfigFile(dest, projectName)
  setupHelpMessage(dest)
  setupReadme({ dest, repoSrc, branch, projectName })

  rmFile(join(dest, 'scripts', 'help.js'))
  rmFile(join(dest, 'LICENSE'))
  rmFile(join(dest, 'CHANGELOG.md'))
  rmFile(join(dest, 'size.md'))
  rmFile(join(dest, 'speed.md'))

  let message = `
Done.

Get started by typing:

  cd ${dest}
  ./scripts/init.sh   # run this script again if you clone the project on another machine
  npm start

To update database schema, see ./db/README.md

More help message see ./help.txt
`.trim()
  console.log(message)
  console.log()
}
main().catch(err => console.error(err))
