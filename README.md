# OpenSustain Analytics Web

This directory contains the Next.js scaffold for the frontend migration.

## Requirements

- Node.js `18.18.0` or newer
- npm

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

## Typecheck

```bash
npm run typecheck
```

## Build

```bash
npm run build
```

## Data Source

The app reads prebuilt JSON payloads from `public/data/`.

Regenerate those payloads from the repo root with:

```bash
make build-json
```

## Current Routes

- `/`
- `/projects`
- `/organizations`
- `/topics`
