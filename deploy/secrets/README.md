# Secret Stores

`deploy/secrets/` contains names-only contracts and runbooks for provider secret
stores. It must never contain real values, provider IDs, downloaded secret
payloads, or local `.env` files.

## Verification

```bash
npm run check:secrets
```

## Planned Providers

- Cloudflare Workers secrets / Secrets Store for runtime Worker secrets.
- GitHub Actions environment secrets for CI/CD deployment credentials.
- Supabase project secrets for Supabase-side runtime configuration.

Prefer short-lived or OIDC-based authentication where provider support exists.
Long-lived secrets must have a rotation cadence and emergency revocation path.
