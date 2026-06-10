using Betonator.Auth;
using Betonator.Data;
using Betonator.Domain;
using Betonator.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Betonator.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/users").RequireAuthorization("Admin");

        g.MapGet("/", async (BetonatorDbContext db) =>
        {
            var users = await db.Users.OrderBy(u => u.Username).ToListAsync();
            return Results.Ok(users.Select(u => u.ToDto()));
        });

        g.MapPost("/", async (CreateUserRequest req, BetonatorDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            {
                return Results.BadRequest(new { error = "Username and password are required." });
            }

            var exists = await db.Users.AnyAsync(u => u.Username == req.Username);
            if (exists) return Results.Conflict(new { error = "Username already taken." });

            var user = new User
            {
                Username = req.Username,
                PasswordHash = PasswordHasher.Hash(req.Password),
                Email = req.Email,
                IsAdmin = req.IsAdmin,
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
            return Results.Created($"/users/{user.Id}", user.ToDto());
        });

        g.MapPut("/{id:int}", async (int id, UpdateUserRequest req, BetonatorDbContext db) =>
        {
            var user = await db.Users.FindAsync(id);
            if (user is null) return Results.NotFound();

            if (req.Email is not null) user.Email = req.Email;
            if (req.IsAdmin.HasValue) user.IsAdmin = req.IsAdmin.Value;
            if (req.IsDisabled.HasValue) user.IsDisabled = req.IsDisabled.Value;
            if (!string.IsNullOrWhiteSpace(req.NewPassword))
            {
                user.PasswordHash = PasswordHasher.Hash(req.NewPassword);
            }

            await db.SaveChangesAsync();
            return Results.Ok(user.ToDto());
        });

        return app;
    }
}
