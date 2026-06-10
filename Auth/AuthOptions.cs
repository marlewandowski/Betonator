namespace Betonator.Auth;

public class AuthOptions
{
    public string Issuer { get; set; } = "Betonator";
    public string Audience { get; set; } = "Betonator";
    public string SigningKey { get; set; } = "";
    public int ExpirationDays { get; set; } = 7;
}
