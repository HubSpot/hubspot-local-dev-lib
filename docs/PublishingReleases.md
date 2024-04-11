# Publishing Releases

Before releasing a new version, it's a good idea to get in touch with the HubSpot team to coordinate. Only contributers who are members of the HubSpot NPM organization can publish releases.

## Publishing a new version

The publish commands will handle bumping the version, tagging via git, and publishing the packages to NPM.

1. For a major release with breaking changes, run `yarn release:major` on the `main` branch.
2. For a minor release with new features but no breaking changes, run `yarn release:minor` on the `main` branch.
3. For a patch release with bug fixes, run `yarn release:patch` on the `main` branch.
