# Data And Operations Safety

## Default Rule

For production-like data:

**inspect first, back up first, mutate narrowly, verify after**

## Preferred Order

1. read-only inspection
2. existing admin or service-layer fix
3. targeted script or migration
4. direct database update only when the safer layers are insufficient

## Before Any Direct Data Fix

Capture:

- exact failing symptom
- rows or records involved
- current values
- intended new values
- why the application path cannot fix it directly

Then make sure you have:

- a backup or rollback path
- a minimal scope
- a post-fix verification query or API call

## Common High-Risk Cases

- admin password state versus environment password drift
- encryption key rotation or mismatch
- settings stored encrypted under an old key
- logical delete flags that block visibility
- stale media paths
- partially migrated records

## Encryption And Secret Rules

- Treat encryption keys as environment-bound operational state.
- Changing a key without re-encrypting dependent data will break reads.
- When a system stores encrypted settings, verify both:
  - the current key material
  - the current ciphertext format

If secret decryption fails:

1. identify whether the ciphertext is corrupt or just bound to an older key
2. prefer controlled re-entry or re-encryption over silent fallback
3. document the recovery action

## Delete Strategy

- Prefer logical delete when the product has restore, audit, or operation-log recovery features.
- Use hard delete only when the system explicitly expects irreversible removal and the user has asked for it.

## After the Fix

Verify all of these that apply:

- the record now has the intended values
- the backing API succeeds
- the affected screen succeeds
- no unrelated screen now fails because it depended on the same setting or state
