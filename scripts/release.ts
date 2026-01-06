import { buildReleaseScript } from '@hubspot/npm-scripts/src/release';
import path from 'path';
import { build } from './lib/build.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const packageJsonLocation = path.resolve(
  path.join(__dirname, '..', 'package.json')
);

buildReleaseScript({
  packageJsonLocation,
  buildHandlerOptions: {
    repositoryUrl: 'https://github.com/HubSpot/hubspot-local-dev-lib',
    build,
    mainBranch: 'main',
  },
});
