# handyServer

`handyServer` publishes the `hserve` command: a small Node.js CLI for serving a
local directory over HTTP. It is intended for quick static file previews during
development, with a configurable port, static directory, and URL prefix.

The package requires Node.js 18 or newer.

## Install

Install the published CLI globally:

```bash
npm install -g hserve
```

Then run it from the directory you want to serve:

```bash
hserve
```

By default, files from the current working directory are served at the `static`
route on port `3000`.

## Run From Source

```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm run serve
```

To pass CLI arguments through the source script:

```bash
pnpm run serve -- serve --dir public --port 8080 --api assets
```

## CLI Usage

```bash
hserve
hserve serve [options]
```

`hserve` without a subcommand falls back to `hserve serve`.

Examples:

```bash
hserve serve --dir public --port 8080
hserve serve -d ./dist -p 3001 -a files
```

## Options

| Option | Alias | Value | Default | Behavior |
| --- | --- | --- | --- | --- |
| `--port` | `-p` | Port number | `3000` | Accepts integer ports from `1` to `65535`. Missing or invalid values fall back to `3000`. |
| `--dir` | `-d` | Directory path | Current working directory | Accepts relative or absolute paths. Relative paths are resolved from the process working directory. |
| `--api` | `-a` | Static URL route | `static` | Normalizes leading and trailing slashes. Query strings and hashes are rejected. Routes whose normalized name starts with `api` are rejected, preserving the built-in `api/v1/health` health endpoint. |

## Validation

The CI workflow installs dependencies with pnpm, typechecks, builds, validates
serve option normalization, and checks package contents. The same lightweight
checks can be run locally:

```bash
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm run build
pnpm run check:serve-options
pnpm run check:pack
```

`pnpm run check:serve-options` rebuilds before running the option normalization
checks in `scripts/check-serve-options.mjs`. `pnpm run check:pack` verifies that
the dry-run npm package includes the configured `main` and `bin` entries.

## Current Boundaries

- `hserve` is a static file server for local development workflows.
- It does not provide directory listings, file watching, live reload, HTTPS, or
  authentication.
- Invalid ports fall back to the default port instead of failing the command.
- The `api` route family is reserved by the server. Use another static route,
  such as `static`, `assets`, or `files`.

## License

Released under the [MIT License](LICENSE).
