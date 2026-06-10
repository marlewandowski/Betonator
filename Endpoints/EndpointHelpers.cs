using System.Security.Claims;

namespace Betonator.Endpoints;

public static class EndpointHelpers
{
    public static int UserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? user.FindFirstValue("sub")
                  ?? throw new InvalidOperationException("Missing user id claim.");
        return int.Parse(sub);
    }

    public static bool IsAdmin(this ClaimsPrincipal user) => user.IsInRole("Admin");
}
