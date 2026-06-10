using Betonator.Auth;
using Betonator.Domain;
using Microsoft.EntityFrameworkCore;

namespace Betonator.Data;

public static class DbInitializer
{
    public static async Task EnsureSeededAsync(IServiceProvider sp)
    {
        await using var scope = sp.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<BetonatorDbContext>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbInitializer");

        await db.Database.MigrateAsync();

        if (await db.Users.AnyAsync()) return;

        var username = config["BootstrapAdmin:Username"];
        var password = config["BootstrapAdmin:Password"];
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException(
                "No users in DB and BootstrapAdmin:Username/Password not configured. " +
                "Set them in appsettings.json or environment variables on first run.");
        }

        var admin = new User
        {
            Username = username,
            PasswordHash = PasswordHasher.Hash(password),
            IsAdmin = true,
            IsDisabled = false,
        };
        db.Users.Add(admin);
        await db.SaveChangesAsync();

        logger.LogWarning(
            "Seeded bootstrap admin '{Username}'. Change the password immediately via PUT /users/{Id}.",
            username, admin.Id);
    }
}
