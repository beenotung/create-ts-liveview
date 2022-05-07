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
  console.log('Copying ts-liveivew template to:', dest, '...')
  let branch = 'v2'
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
Inside that directory, you can run several commands:

  npm run dev
    Start the development server, with realtime update and live-reload.

  npm run build
    Build the typescript project into esm javascript in 'dist' folder.

  npm start
    Run the built server in 'dist' folder (for production deployment).

Details refer to https://github.com/beenotung/ts-liveview


Get started by typing:

  cd ${dest}
  pnpm i --prefer-offline
  pnpm dev


Installation Alternatives:

  pnpm install
  or
  yarn install
  or
  npm install
`.trim(),
  )
}
main().catch(err => console.error(err))
