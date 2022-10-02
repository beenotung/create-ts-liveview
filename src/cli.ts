#!/usr/bin/env node
import { execSync } from 'child_process'
import { existsSync, unlinkSync, writeFileSync } from 'fs'
import { cloneTemplate, getDest } from 'npm-init-helper'
import { EOL } from 'os'
import { basename, join } from 'path'

let branch = 'v4'
let repoSrc = 'https://github.com/beenotung/ts-liveview'
let gitSrc = `${repoSrc}#${branch}`
let readmeUrl = `${repoSrc}/blob/${branch}/README.md`

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

  let helpMessage = execSync(join('scripts', 'help.js'), {
    cwd: dest,
  }).toString()
  writeFileSync(join(dest, 'help.txt'), helpMessage)

  rmFile(join(dest, 'scripts', 'help.js'))
  rmFile(join(dest, 'LICENSE'))
  rmFile(join(dest, 'CHANGELOG.md'))
  rmFile(join(dest, 'size.md'))
  rmFile(join(dest, 'speed.md'))

  let projectName = basename(dest)

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
}
main().catch(err => console.error(err))
