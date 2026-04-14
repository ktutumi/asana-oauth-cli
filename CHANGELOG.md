# Changelog

## v0.2.0 (2026-04-15)

### Features

- **tasks list**: Add `tasks list` command to list tasks under a project (#6)
- **project list**: Add `projects list` command to list projects under a workspace (#2)
- **task detail endpoints**: Add `tasks get`, `tasks subtasks`, `tasks stories`, and `tasks attachments` commands (#8)
- **global bin rename**: Rename the global CLI command to `asn` (#7)

### Documentation

- Make README bilingual — English primary (`README.md`), Japanese preserved (`README.ja.md`) (#9)
- Add AGENTS and CLAUDE guidance hierarchy (#3, #4)
- Add PR template (#1)
- Add README badges

### Chores

- Migrate package management to pnpm (#5)

## v0.1.0 (2026-04-14)

- Initial release
- OAuth login flow (`auth url`, `auth exchange`, `auth login`, `auth refresh`)
- `me` command
- `workspaces list` command