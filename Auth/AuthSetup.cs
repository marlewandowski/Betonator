using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Betonator.Auth;

public static class AuthSetup
{
    public static IServiceCollection AddBetonatorAuth(this IServiceCollection services, IConfiguration config)
    {
        services.Configure<AuthOptions>(config.GetSection("Jwt"));
        services.AddSingleton<JwtTokenService>();

        var opts = config.GetSection("Jwt").Get<AuthOptions>() ?? new AuthOptions();
        if (string.IsNullOrWhiteSpace(opts.SigningKey) || opts.SigningKey.Length < 32)
        {
            throw new InvalidOperationException(
                "Jwt:SigningKey must be configured and at least 32 characters long.");
        }

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(o =>
            {
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = opts.Issuer,
                    ValidateAudience = true,
                    ValidAudience = opts.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(opts.SigningKey)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromSeconds(30),
                };
            });

        services.AddAuthorization(o =>
        {
            o.AddPolicy("Admin", p => p.RequireRole("Admin"));
        });

        return services;
    }

    public static WebApplication UseBetonatorAuth(this WebApplication app)
    {
        app.UseAuthentication();
        app.UseAuthorization();
        return app;
    }
}
