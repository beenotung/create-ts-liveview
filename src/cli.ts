#!/usr/bin/env node
import { existsSync, renameSync, unlinkSync, writeFileSync } from 'fs'
import { cloneTemplate, getDest } from 'npm-init-helper'
import { basename, join } from 'path'

function rmFile(file: string) {
  if (existsSync(file)) {
    unlinkSync(file)
  }
}

async function main() {
  let dest = await getDest()
  let branch = 'v3'
  console.log(`Copying ts-liveivew (${branch}) template to: ${dest} ...`)
  await cloneTemplate({
    gitSrc: 'https://github.com/beenotung/ts-liveview#' + branch,
    srcDir: '.',
    dest,
    updatePackageJson: true,
  })

  rmFile(join(dest, 'LICENSE'))
  rmFile(join(dest, 'CHANGELOG.md'))
  rmFile(join(dest, 'size.md'))
  rmFile(join(dest, 'speed.md'))

  let projectName = basename(dest)
  writeFileSync(
    join(dest, 'README.md'),
    `
# ${projectName}

Powered by [ts-liveview](https://github.com/beenotung/ts-liveview/blob/${branch}/README.md)
`.trim() + '\n',
  )

  console.log(
    `
Done.
Inside the project directory, you can run several commands:

  npm run dev
    Start the development server, with realtime update and live-reload.

  npm run build
    Build the typescript project into esm javascript in 'build' folder.

  npm start
    Run the built server in 'build' folder (for production deployment).

Details refer to https://github.com/beenotung/ts-liveview


Get started by typing:

  cd ${dest}/cd
  pnpm i --prefer-offline   # you can also install with yarn or npm
  npm run migrate
  cd ..
  pnpm i --prefer-offline
  npm run dev

`.trim(),
  )
}
main().catch(err => console.error(err))
