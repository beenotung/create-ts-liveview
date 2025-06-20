#!/usr/bin/env node
import { execSync } from 'child_process'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { ask, cloneTemplate, hasExec } from 'npm-init-helper'
import { EOL, userInfo } from 'os'
import { basename, join } from 'path'
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
    if (!branch) {
      let branches = [
        'v5-demo (kitchen sink)',
        'v5-minimal-template (single page starter)',
        'v5-minimal-without-db-template',
        'v5-web-template (mobile responsive)',
        'v5-ionic-template (mobile-first)',
        'v5-hybrid-template (web + ionic)',
        'v5-auth-template (hybrid + authentication)',
        'v5-auth-web-template',
        'v5-auth-ionic-template',
      ]
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
        } else {
          branch = input
        }
        branch = branch?.split(' ')[0]
      }
      console.log(`chosen template: ${branch}`)
    }
    while (!dest) {
      dest = await ask('project directory: ')
    }
  }
  return {
    branch,
    dest,
  }
}

function setupConfigFile(dest: string, projectName: string) {
  /* setup scripts/config */
  let shortName = projectName.replace(/-server$/, '')
  let file = join(dest, 'scripts', 'config')
  let text = readFileSync(file).toString()
  text = text
    .replace('beenotung/ts-liveview', userInfo().username + '/' + projectName)
    .replace('liveviews', shortName)
    .replace('ts-liveview', shortName)
  writeFileSync(file, text)

  /* setup server/config.ts */
  let shortSiteName = shortName
    .split('-')
    .map(s => s.slice(0, 1).toLocaleUpperCase())
    .join('')
  let siteName = shortName
    .split('-')
    .map(s => s.slice(0, 1).toLocaleUpperCase() + s.slice(1))
    .join(' ')
  file = join(dest, 'server', 'config.ts')
  text = readFileSync(file).toString()
  text = text
    .replace(
      `short_site_name: 'demo-site'`,
      `short_site_name: '${shortSiteName}'`,
    )
    .replace(`site_name: 'ts-liveview'`, `site_name: '${siteName}'`)
  writeFileSync(file, text)
}

function setupHelpMessage(dest: string) {
  let helpMessage = execSync('node ' + join('scripts', 'help.js'), {
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

function hasGitRepo(dest: string) {
  try {
    execSync('git status', { cwd: dest, stdio: 'ignore' })
    return true
  } catch (err) {
    return false
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

  setupConfigFile(dest, projectName)
  setupHelpMessage(dest)
  setupReadme({ dest, repoSrc, branch, projectName })

  rmFile(join(dest, 'scripts', 'help.js'))
  rmFile(join(dest, 'scripts', 'rebase-template.sh'))
  rmFile(join(dest, 'scripts', 'check-commits.sh'))
  rmFile(join(dest, 'scripts', 'reset-template.sh'))
  rmFile(join(dest, 'LICENSE'))
  rmFile(join(dest, 'CHANGELOG.md'))
  rmFile(join(dest, 'README-zh.md'))
  rmFile(join(dest, 'size.md'))
  rmFile(join(dest, 'speed.md'))

  // git init
  if (!hasGitRepo(dest)) {
    let ans = await ask('Do you want to init a git repo? (Y/n): ')
    if (ans == '') {
      console.log('default: yes')
      ans = 'y'
    }
    ans = ans.trim().toLowerCase()[0]
    if (ans == 'y') {
      execSync('git init', { cwd: dest })
    }
  }

  // git commit
  if (hasGitRepo(dest)) {
    execSync('git add .', { cwd: dest })
    execSync(
      `git commit -m 'init: setup project skeleton with "npm init ts-liveview" using ${branch}'`,
      { cwd: dest },
    )
  }

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
