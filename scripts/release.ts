import { buildReleaseScript } from '@hubspot/npm-scripts/src/release';
import path from 'path';
import { build } from './lib/build';

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
