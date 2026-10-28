---
name: angular-feature
description: Conventions for nohanml's Angular app in `frontend/`. Use when adding or changing a page, admin screen, component, service, store, model, route or style.
---

# Angular feature

`experiences` is the reference feature end to end: public page, card, store, service and admin screen.

## Where things go

```
frontend/src/app/
├── core/components/      # shared components: cards, skeleton, navbar, splash screen
├── core/services/        # one HTTP service per API resource
├── core/models/          # interfaces mirroring the API's JSON
├── store/                # one signalStore per resource
└── features/
    ├── <page>/           # public pages
    └── admin/<resource>/ # admin screens
```

Public pages are lazy `loadComponent` routes in `app.routes.ts`. Admin screens are children in `features/admin/admin.routes.ts`, already behind `adminAuthGuard`, and each one gets a link in `features/admin/layout/admin-layout.component.html`.

## Components

Every component is standalone, `ChangeDetectionStrategy.OnPush`, selector prefixed `app-`, with its own `.html` and `.scss`. Generate with `yarn --cwd frontend ng generate component <path> --type=component` (and `ng generate service <path> --type=service`): the `--type` flag keeps the repo's `.component.ts` / `.service.ts` names, which Angular 21 drops by default. Inside: `inject()` for dependencies, `input()` / `input.required()` for inputs, `signal()` for local state, `@if` and `@for (…; track …)` in templates.

## Data flow

- **Service**: `HttpClient` calls built on `environment.apiUrl`. Reads hit `/<plural>`, writes hit `/admin/<plural>`: the `authInterceptor` attaches the token only when the URL contains `/admin`.
- **Model**: an interface in `core/models/` matching the entity's JSON, dates as `string`.
- **Store**: copy `store/experiences.store.ts`: `signalStore({ providedIn: 'root' }, withState, withMethods)` holding the items, `loading` and `error`; methods load with `firstValueFrom` and `patchState`.
- **Preloading**: public data loads behind the splash screen, so a new store's load call joins `AppLoadService.init()`; the page reloads only when the store is empty.
- **Public page states**: `loading` shows a grid of `<app-skeleton-card />`, `error` a `<p class="error" role="alert">`, an empty list a short message, data a grid with the global `fade-in` class.
- **Admin screen**: copy `features/admin/experiences/`: a `FormBuilder` form, `editing` / `saving` / `error` signals, write through the service, then reload the store. Images go through `UploadService.upload(file, '<resource>/<kind>')`, which returns the public URL to save.

## Styles

- Colors come from the CSS variables in `src/styles.scss` (`--color-primary`, `--color-bg`, `--color-bg-surface`, `--color-text`, `--color-text-muted`, `--color-border`…). Each is defined twice, under `[data-theme="dark"]` and `[data-theme="light"]`; a new color gets both definitions, and the result is checked in both themes.
- Global classes: `.container`, `.skeleton`, `.fade-in`. Admin stylesheets start with `@use '../admin-shared';`.
- The production build fails when a single component stylesheet passes 8 kB (warning at 4 kB): move shared rules to `styles.scss` or `_admin-shared.scss`.

## Copy and accessibility

Interface text is in French. Templates are linted with Angular's accessibility rules: actions are `<button>` or `<a>`, any other clickable element gets `tabindex` and a keyboard handler, images get `alt`, icon-only links get `aria-label`.

Vercel Analytics drops every URL containing `/admin` (`src/main.ts`), so admin routes stay under `/admin`.
