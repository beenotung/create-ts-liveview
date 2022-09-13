#!/usr/bin/env node
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { cloneTemplate, getDest } from 'npm-init-helper'
import { EOL } from 'os'
import { basename, join } from 'path'

let branch = 'v4'
let repoSrc = 'https://github.com/beenotung/ts-liveview'
let gitSrc = `${repoSrc}#${branch}`
let readmeUrl = `${repoSrc}/blob/${branch}/README.md`
let createRepoUrl = 'https://github.com/beenotung/create-ts-liveview'
let templateRepoUrl = `${repoSrc}/tree/${branch}`

function rmFile(file: string) {
  if (existsSync(file)) {
    unlinkSync(file)
  }
}

function parseGetStartedMessage(projectName: string, text: string): string {
  let lines = text.split('\n').map(lines => lines.replace('\r', ''))
  let start = lines.findIndex(line => line.startsWith('## Get Started'))
  let end = lines.findIndex((line, i) => i > start && line.startsWith('## '))
  let segments = lines.slice(start, end)
  let cdSnippet = 'cd ' + projectName
  let linkRegex = /\[.*?\]\((.*?)\)/
  function transformLink(_match: string, capture: string) {
    if (capture === createRepoUrl) {
      return templateRepoUrl
    }
    return capture
  }
  let mode = 'text'
  function transformLine(line: string) {
    if (line.startsWith('## Get Started')) {
      return 'Get started by typing:'
    }
    if (line.startsWith('```bash')) {
      mode = 'code'
      return null
    }
    if (line.startsWith('```')) {
      mode = 'text'
      return null
    }
    if (mode === 'code') {
      if (line.startsWith('npm init ')) return null
      line = line.replace('cd my-app', cdSnippet)
      return '  ' + line
    }
    return line.replace(linkRegex, transformLink)
  }
  return segments
    .map(line => transformLine(line))
    .filter(line => line !== null)
    .join(EOL)
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

  rmFile(join(dest, 'LICENSE'))
  rmFile(join(dest, 'CHANGELOG.md'))
  rmFile(join(dest, 'size.md'))
  rmFile(join(dest, 'speed.md'))

  let readmeFile = join(dest, 'README.md')
  let projectName = basename(dest)
  let readmeText = readFileSync(readmeFile).toString()
  let getStartedMessage = parseGetStartedMessage(projectName, readmeText)
  let message = `
Done.

Inside the project directory, you can run several commands:

  npm run dev
    Start the development server, with realtime update and live-reload.

  npm run build
    Build the typescript project into esm javascript in 'build' folder.

  npm start
    Run the built server in 'build' folder (for production deployment).

${getStartedMessage}
`.trim()

  writeFileSync(
    readmeFile,
    `
# ${projectName}

Powered by [ts-liveview](${readmeUrl})
`.trim() + EOL,
  )

  console.log(message)
}
main().catch(err => console.error(err))
