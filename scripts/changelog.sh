#!/usr/bin/env bash

TAG=$(git describe --tags --abbrev=0)
printf "\e[1;36mGetting changelog for $(basename -s .git `git config --get remote.origin.url`) since $TAG\e[1;0m\n"
git --no-pager log $TAG..origin/main --pretty=format:'- %Cgreen %s %Creset–%Cblue @%al %Creset' --no-merges --source
printf "\n"
