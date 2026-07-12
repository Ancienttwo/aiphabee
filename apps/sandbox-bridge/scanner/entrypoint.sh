#!/bin/sh
set -eu

# The image build refreshes the bundled signature database. Runtime network
# egress stays off; a missing or older-than-72h engine is rejected by health
# and scan instead of silently scanning with stale authority.
export CLAMAV_NO_FRESHCLAMD=true

clamd --foreground --config-file=/etc/clamav/clamd.conf &
exec /usr/local/bin/artifact-scanner
