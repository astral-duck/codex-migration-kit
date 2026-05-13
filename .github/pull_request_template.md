## Summary

- 

## Safety

- [ ] No generated payloads, real `.codex` data, auth files, env files, or private paths are committed.
- [ ] Restore still validates payloads before mutating target state.
- [ ] Auth remains excluded.

## Test Plan

- [ ] `npm test`
- [ ] `npm run check:personal-data`
- [ ] `npm pack --dry-run`

