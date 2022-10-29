#!/usr/bin/env node
import { execSync } from 'child_process'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { cloneTemplate, getDest,  hasExec } from 'npm-init-helper'
import { EOL, userInfo } from 'os'
import { basename, join } from 'path'

let branch = 'v4'
let repoSrc = 'https://github.com/beenotung/ts-liveview'
let gitSrc = `${repoSrc}#${branch}`
let readmeUrl = `${repoSrc}/blob/${branch}/README.md`


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
  let dest = await getDest()
  console.log(`Copying ts-liveview (${branch}) template to: ${dest} ...`)
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

Powered by [ts-liveview](${readmeUrl})

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
