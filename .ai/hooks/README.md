# Repo-Local Hook Fallback

Active hook execution is user-level and central-first. Files under `.ai/hooks/lib/` support repo workflow helpers; full hook runtime scripts are not vendored unless `.ai/harness/policy.json` explicitly sets `hook_source` to `repo`.
