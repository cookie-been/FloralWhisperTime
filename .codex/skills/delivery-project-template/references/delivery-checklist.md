# Delivery Checklist

Use this as a reusable close-out checklist for delivery-oriented work.

## 1. Intake

- read repo-level instructions
- read subproject instructions
- identify runtime topology
- identify auth model
- identify deployment entrypoint
- identify high-risk data or secret surfaces

## 2. Before Editing

- confirm the user-visible goal
- identify the exact proving commands
- inspect current behavior
- inspect recent related changes when relevant

## 3. During Implementation

- keep changes scoped
- update all affected shared contracts
- avoid hidden refactors
- note any operational side effects immediately

## 4. Verification

- run the build or type-check command
- run targeted tests if available
- verify the affected API or service path
- verify the affected user or admin path
- capture any remaining risk or limitation

## 5. Deployment

- use the official deployment entrypoint
- verify health endpoint
- verify primary URL
- verify at least one critical functional path
- confirm the deployed revision if the system records one

## 6. Data And Operations

- back up before high-risk data fixes
- inspect current values before mutating
- verify the repaired state after mutation
- document any direct data repair or operational override

## 7. Documentation

- update startup or deployment docs if commands changed
- update env docs if variables or semantics changed
- update release notes if behavior or operations changed
- update admin or ops docs if workflows changed

## 8. Final State

- working tree reviewed
- intended files only
- commit message is accurate
- push handled if requested
- final report states what changed, what was verified, and any remaining risk
