using System.Security.Claims;
using Betonator.Auth;
using Betonator.Data;
using Betonator.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Betonator.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/auth/login", async (LoginRequest req, BetonatorDbContext db, JwtTokenService jwt) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Username == req.Username);
            if (user is null || user.IsDisabled || !PasswordHasher.Verify(req.Password, user.PasswordHash))
            {
                return Results.Unauthorized();
            }

            var token = jwt.Issue(user);
            return Results.Ok(new LoginResponse(token, user.ToDto()));
        });

        app.MapGet("/me", async (ClaimsPrincipal principal, BetonatorDbContext db) =>
        {
            var id = principal.UserId();
            var user = await db.Users.FindAsync(id);
            return user is null ? Results.Unauthorized() : Results.Ok(user.ToDto());
        }).RequireAuthorization();

        return app;
    }
}
