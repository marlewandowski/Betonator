# Betonator

Internal football betting pool ("typer") for placing match predictions with friends. Replaces a deprecated MySQL-based system (`zaklady.sql` kept at the repo root for reference only).

- **Backend**: ASP.NET Core 10 Minimal APIs + EF Core 10 (SQLite) + JWT bearer + BCrypt
- **Frontend**: Angular 20 (standalone components, Material) in `clientapp/`
- **DB**: SQLite file `betonator.db` at the repo root, auto-created on first run

## Prerequisites

- .NET 10 SDK (`dotnet --version` ≥ 10.0)
- Node 22+ and npm
- `dotnet-ef` global tool: `dotnet tool install -g dotnet-ef`

## First run

1. Edit `appsettings.json`:
   - Replace `Jwt:SigningKey` with at least 32 random characters.
   - Set `BootstrapAdmin:Username` / `Password` to your initial admin credentials.
2. Start the API:
   ```bash
   dotnet run
   ```
   On first start the DB migrations apply and the bootstrap admin is seeded. The admin password should be changed via `PUT /users/{id}` after first login.
3. In another terminal, install and run the Angular client:
   ```bash
   cd clientapp
   npm install
   npm start
   ```
4. Open http://localhost:4200 and log in with the bootstrap admin.

## Default URLs

- API: `http://localhost:5130` and `https://localhost:7259` (see `Properties/launchSettings.json`)
- Angular dev server: `http://localhost:4200` (proxies `/auth`, `/me`, `/users`, `/competitions`, `/matches` to the API)
- OpenAPI: `http://localhost:5130/openapi/v1.json`

## Scoring rules

Default `ClassicPolishTyperRule`:
- Exact score → **3 points**
- Same goal difference (covers correct draw or correct margin) → **2 points**
- Same outcome only (1/X/2 right) → **1 point**
- Anything else → **0 points**

The rule is pluggable via `IScoringRule` registered in `Program.cs`.

## Working with migrations

```bash
# add a new migration after editing entities or DbContext
dotnet ef migrations add MyChange -o Data/Migrations

# apply
dotnet ef database update

# drop the DB (it's just a file)
rm betonator.db
```

The app auto-applies pending migrations on startup, so usually `dotnet run` is enough.

## Project layout

```
Auth/              JWT issuance, BCrypt hashing, auth wiring
Data/              DbContext, migrations, seeder
Domain/            POCO entities (User, Competition, Match, Bet, CompetitionParticipant)
Dtos/              Request/response records + mappers
Endpoints/         Minimal API groups (auth, users, competitions, matches, bets)
Services/          IScoringRule + default implementation
clientapp/         Angular workspace
```

## Production notes (future work)

- Rotate `Jwt:SigningKey` and `BootstrapAdmin:Password`. Override both via environment variables.
- For single-origin hosting: build the Angular app with `ng build --output-path ../wwwroot`, add `app.UseDefaultFiles().UseStaticFiles()` and a SPA fallback in `Program.cs`. Out of scope for v1.
- Historical data import from `zaklady.sql` is not implemented. The schema is designed so a one-shot import can be added later (carry `PlacedAt` from `TIME_OF_BET`, force password resets — old MD5 hashes are not reused).
