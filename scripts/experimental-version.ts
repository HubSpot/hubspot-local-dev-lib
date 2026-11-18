import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getDistTags,
  getPublishedVersions,
} from '@hubspot/npm-scripts/src/utils/npm';
import { computeExperimentalVersion } from '@hubspot/npm-scripts/src/utils/release/version';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { name }: { name: string } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8')
);

const distTags = await getDistTags(name);
const publishedVersions = await getPublishedVersions(name);

console.log(computeExperimentalVersion(distTags.latest, publishedVersions));
