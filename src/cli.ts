#!/usr/bin/env node
import { cloneTemplate, getDest } from 'npm-init-helper'

async function main() {
  let dest = await getDest()
  console.log('Copying ts-liveivew template to:', dest, '...')
  cloneTemplate({
    gitSrc: 'https://github.com/beenotung/ts-liveview#v2-rc3-jsx-with-context',
    srcDir: '.',
    dest,
    updatePackageJson: true,
  })

  console.log(
    `
Done.
Inside that directory, you can run several commands:

  npm run dev
    Starts the development server, with realtime update and live-reload.

  npm run build
    Builds the typescript project into esm javascript in 'dist' folder.

  npm start
    Run the built server in 'dist' folder.

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
