# Nodics Agora Apparel Frontend Contract

`nodics.agora.apparel` is an independent Apparel storefront app. It owns only
the executable React experience for the Apparel domain.

## AI tool entry path

Read this file, the README, and the nearest source/test contract before changing
files. The renderer contract required by this reusable storefront template lives
inside this app so the repository remains self-contained.

## Change rules

- Apparel-specific UX belongs in this repository.
- Template renderer contracts required at runtime belong in this repository.
- Backend business logic belongs in `nodics.ai`.
- Apparel reference data belongs in the `agora.apparel` Kickoff module.
- Do not add Electronics or Telco renderer files to this app.
- Do not commit generated output, media caches, logs, database files, or local
  runtime artifacts.
