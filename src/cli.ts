#!/usr/bin/env node
import { renameSync, writeFileSync } from 'fs'
import { cloneTemplate, getDest } from 'npm-init-helper'
import { basename, join } from 'path'

async function main() {
  let dest = await getDest()
  console.log('Copying ts-liveivew template to:', dest, '...')
  await cloneTemplate({
    gitSrc: 'https://github.com/beenotung/ts-liveview#v2-rc3-jsx-with-context',
    srcDir: '.',
    dest,
    updatePackageJson: true,
  })

  renameSync(join(dest, 'README.md'), join(dest, 'toolkit.md'))

  let projectName = basename(dest)
  writeFileSync(
    join(dest, 'README.md'),
    `
# ${projectName}

Powered by [ts-liveview](./toolkit.md)
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
