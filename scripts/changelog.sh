#!/bin/bash
# Pull the repo and pipe only stdout to /dev/null
git pull 1> /dev/null

# Get the most recent tag
TAG=$(git describe --tags --abbrev=0)

printf "\e[1;36mGetting changelog for $(basename -s .git `git config --get remote.origin.url`) since $TAG\e[1;0m\n"

# Get the commit log diff between the most recent tag and origin/main
git --no-pager log $TAG..origin/main --pretty=format:'- %Cgreen %s %Creset–%Cblue @%al %Creset' --no-merges --source
printf "\n"
