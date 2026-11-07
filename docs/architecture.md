# Architecture

The React client calls an ASP.NET Core API through `/api`. Controllers handle HTTP concerns; scoped services own validation and business operations. Entity Framework Core uses PostgreSQL and versioned migrations. Circulation operations will use transactions and conditional database updates, preserving availability under concurrent requests.

The application is intended for a trusted local staff environment. Public hosting and identity management are outside this internship scope. No deployment workflow is configured.

## Feature delivery

An empty initial commit bootstraps main because the existing remote had no commits. All implementation follows in feature pull requests. Each feature starts from the updated main, passes local checks and GitHub Actions, and is reviewed before merging.

## Design context

The interface serves library staff at a bright desk. Light warm-neutral surfaces, a muted plum action color, clear table typography and compact status labels keep circulation readable. PRODUCT.md captures the design principles. Run `$impeccable document` later to document the implemented visual tokens in DESIGN.md.
