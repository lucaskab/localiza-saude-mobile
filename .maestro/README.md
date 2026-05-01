# Maestro E2E

Maestro is installed globally through the official installer. If a new machine needs it:

```sh
curl -Ls https://get.maestro.mobile.dev | bash
export PATH="$PATH":"$HOME/.maestro/bin"
```

The package scripts default to the app currently installed by `bun run ios`:

- iOS bundle id / Android package: `com.llf.localizasaude`
- Development variant: `com.llf.localizasaude.dev`

Before starting Maestro, `scripts/e2e-maestro.sh` disables the Expo Dev Client
floating dev-menu button on the booted iOS simulator. This keeps the FAB from
intercepting taps during E2E runs.

Run the flows with:

```sh
bun run e2e:maestro:public
bun run e2e:maestro:customer
bun run e2e:maestro:provider
```

The public flow clears app state and validates the unauthenticated login screen.

The customer and provider flows intentionally do not clear state. Before running them,
open the dev build once and sign in as the correct role. This avoids brittle E2E tests
against Google/Apple OAuth browser UI.

For a development-variant build, override the app id:

```sh
APP_ID=com.llf.localizasaude.dev bun run e2e:maestro:customer
```
