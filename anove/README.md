# Anove Social

Anove International B.V.'s maintained Postiz fork for its internal marketing
workspace. Upstream base: `v2.24.0`, commit
`8b84b0dc2767b757c2355158573635600ae027c7`.

## Customizations

- Anove login layout, official orange-to-indigo gradient mark and favicon,
  gradient brand accents, wordmark, local Inter font, page titles and colours.
- Local-login presentation for an installation with public registration disabled.
- YouTube scopes limited to userinfo.profile, userinfo.email, youtube.readonly,
  youtube.upload and yt-analytics.readonly.
- Email-bound, single-use invitation signup while public registration stays closed.
- Public corresponding-source download at `/anove/source.tar.gz`.

The application source in `apps/` and `libraries/` is the source of truth.
Server configuration, credentials and backups are managed separately; no live
configuration belongs in this public repository.

## Build

From the repository root:

```sh
docker build -f anove/Dockerfile -t anove-postiz:2.24.0-anove .
```

The build uses the pinned upstream image for dependencies and compiled backend
artifacts, rebuilds the backend and frontend from this repository, and applies a
hash-checked YouTube scope patch to the retained orchestrator. Invitation signup
uses the existing UsedCodes table; it introduces no schema migration.

Allow at least 4 GB of compiler heap plus memory for the operating system and any
running services. Deployment should pin a reviewed Git commit rather than `main`.
The image retains upstream's startup process; review database schema changes
and take a backup before any version upgrade.

The source archive includes modified source, licenses and this build recipe.
Extract it, then run the same Docker command from the extracted root.

## Upstream updates

```sh
git remote add upstream https://github.com/gitroomhq/postiz-app.git # once
git fetch upstream --tags
git switch -c update/postiz-<version>
git merge <reviewed-upstream-tag>
```

Review source conflicts, update the pinned image digest and the scope-patch hashes,
then build and check login, API authentication, social connections, exact OAuth
scopes and MCP before deploying. Do not overwrite the Anove branch with a forced
upstream sync. Inherited upstream publishing and bot jobs are restricted to the
upstream repository; Build and CodeQL remain enabled here.

Postiz and these modifications are distributed under AGPL-3.0; see `../LICENSE`.
Inter uses the SIL Open Font License; see `INTER-LICENSE.txt`.
