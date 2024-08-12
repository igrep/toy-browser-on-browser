#!/bin/bash

set -eu

npm run build

cat <<END > dist/_redirects
# Redirect default Netlify subdomain to primary domain
https://toy-browser-on-browser.netlify.com/* https://the.igreque.info/:splat 301!
END

npx netlify deploy --prod --dir dist --filter @igrep/toy-browser-on-browser-chrome
