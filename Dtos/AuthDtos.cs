namespace Betonator.Dtos;

public record LoginRequest(string Username, string Password);

public record LoginResponse(string Token, UserDto User);

public record UserDto(
    int Id,
    string Username,
    string? Email,
    bool IsAdmin,
    bool IsDisabled,
    DateTime CreatedAt);
