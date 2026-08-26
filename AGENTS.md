# Nodics Agora Apparel Frontend Contract

`nodics.agora.apparel` is an independent Apparel storefront app. It owns only
the executable React experience for the Apparel domain.

## AI tool entry path

Read this file, the README, and the nearest source/test contract before changing
files. Treat `domain.commerce.ui` as the shared renderer contract dependency;
do not copy shared renderer infrastructure back into this app.

## Change rules

- Apparel-specific UX belongs in this repository.
- Shared renderer contracts belong in `domain.commerce.ui`.
- Backend business logic belongs in `nodics.ai`.
- Apparel reference data belongs in the `agora.apparel` Kickoff module.
- Do not add Electronics or Telco renderer files to this app.
- Do not commit generated output, media caches, logs, database files, or local
  runtime artifacts.
