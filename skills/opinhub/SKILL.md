---
name: opinhub
description: Use the OpinHub CLI to search, install, update, and publish agent skills from opinhub.com. Use when you need to fetch new skills on the fly, sync installed skills to latest or a specific version, or publish new/updated skill folders with the npm-installed opinhub CLI.
metadata:
  {
    "opin":
      {
        "requires": { "bins": ["opinhub"] },
        "install":
          [
            {
              "id": "node",
              "kind": "node",
              "package": "opinhub",
              "bins": ["opinhub"],
              "label": "Install OpinHub CLI (npm)",
            },
          ],
      },
  }
---

# OpinHub CLI

Install

```bash
npm i -g opinhub
```

Auth (publish)

```bash
opinhub login
opinhub whoami
```

Search

```bash
opinhub search "postgres backups"
```

Install

```bash
opinhub install my-skill
opinhub install my-skill --version 1.2.3
```

Update (hash-based match + upgrade)

```bash
opinhub update my-skill
opinhub update my-skill --version 1.2.3
opinhub update --all
opinhub update my-skill --force
opinhub update --all --no-input --force
```

List

```bash
opinhub list
```

Publish

```bash
opinhub publish ./my-skill --slug my-skill --name "My Skill" --version 1.2.0 --changelog "Fixes + docs"
```

Notes

- Default registry: https://opinhub.com (override with OPINHUB_REGISTRY or --registry)
- Default workdir: cwd (falls back to Opin workspace); install dir: ./skills (override with --workdir / --dir / OPINHUB_WORKDIR)
- Update command hashes local files, resolves matching version, and upgrades to latest unless --version is set
