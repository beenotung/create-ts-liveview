#!/usr/bin/env node
import { execSync } from 'child_process'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { cloneTemplate, hasExec } from 'npm-init-helper'
import { EOL, userInfo } from 'os'
import { basename, join } from 'path'
import { createInterface } from 'readline'
import { version } from '../package.json'
import https from 'https'

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
      let branches = await getBranches(repo)
      console.log('Available branches:')
      for (let branch of branches) {
        console.log(`- ${branch.name}`)
      }
      branch = await ask('template branch: ')
    }
    if (!dest) {
      dest = await ask('project directory: ')
    }
    iface.close()
  }
  return {
    branch,
    dest,
  }
}

function httpsGet(url: string) {
  return new Promise<any>((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          'User-Agent': 'create-ts-liveview',
          Accept: 'application/json',
        },
      },
      async res => {
        let text = ''
        for await (let chunk of res) {
          text += chunk
        }
        let json = JSON.parse(text)
        resolve(json)
      },
    )
  })
}

async function getBranches(repo: string) {
  let branches = await httpsGet(`https://api.github.com/repos/${repo}/branches`)
  let versions: { name: string; time: number }[] = []
  for (let {
    name,
    commit: { url },
  } of branches) {
    if (!name.startsWith('v')) continue
    if (name < 'v4') continue
    let {
      commit: {
        author: { date },
      },
    } = await httpsGet(url)
    let time = new Date(date).getTime()
    versions.push({ name, time })
  }
  versions.sort((a, b) => a.time - b.time)
  return versions
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

function rmFile(file: string) {
  if (existsSync(file)) {
    unlinkSync(file)
  }
}

async function main() {
  let { branch, dest } = await getParams()
  let repoSrc = `https://github.com/${repo}`
  let gitSrc = `${repoSrc}#${branch}`
  let readmeUrl = `${repoSrc}/blob/${branch}/README.md`

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

  rmFile(join(dest, 'scripts', 'help.js'))
  rmFile(join(dest, 'LICENSE'))
  rmFile(join(dest, 'CHANGELOG.md'))
  rmFile(join(dest, 'size.md'))
  rmFile(join(dest, 'speed.md'))

  let readmeFile = join(dest, 'README.md')
  let readmeText = `
# ${projectName}

Powered by [${repoName}](${readmeUrl})

See [help.txt](help.txt) to get started.
`.trim()
  writeFileSync(readmeFile, readmeText + EOL)

  let message = `
Done.

Get started by typing:

  cd ${projectName}
  ./scripts/init.sh   # run this script again if you clone the project on another machine
  npm run dev

To update database schema, see ./db/README.md

More help message see ./help.txt
`.trim()
  console.log(message)
  console.log()
}
main().catch(err => console.error(err))
