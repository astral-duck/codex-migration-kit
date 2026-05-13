# Local Computer-to-Computer Transfer

The safest transfer model is local export plus private file movement. Do not push generated payloads to Git, Git LFS, issue trackers, public file hosts, or chat logs.

## Recommended Flow

1. On the source machine, run preflight:

   ```bash
   npx codex-migration-kit preflight --target macos --profile standard
   ```

   or:

   ```bash
   npx codex-migration-kit preflight --target windows --profile standard
   ```

2. Export the payload:

   ```bash
   npx codex-migration-kit export --target macos --profile standard
   ```

   or:

   ```bash
   npx codex-migration-kit export --target windows --profile standard
   ```

3. Confirm the generated ZIP exists:

   ```bash
   npx codex-migration-kit validate --payload ./codex-migration-payload.zip
   ```

4. Move `codex-migration-payload.zip` directly to the target machine.
5. On the target machine, run:

   ```bash
   npx codex-migration-kit validate --payload ./codex-migration-payload.zip
   npx codex-migration-kit restore --payload ./codex-migration-payload.zip --dry-run
   npx codex-migration-kit restore --payload ./codex-migration-payload.zip
   codex --login
   ```

## Best Transfer Channels

- External SSD or USB drive formatted for both machines.
- AirDrop for Mac-to-Mac-adjacent handoff when available.
- Local network file sharing on a trusted private network.
- Encrypted private cloud storage only if direct transfer is not practical.

## Avoid

- Git or Git LFS.
- Public object storage.
- Email attachments.
- Issue tracker uploads.
- Any shared workspace where other people or automations can read the ZIP.

## After Transfer

- Keep the ZIP only as long as needed.
- Store it somewhere private if retaining it.
- Delete temporary extracted payload folders.
- Run `codex --login` on the target machine because auth is intentionally not migrated.
