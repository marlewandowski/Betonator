namespace Betonator.Dtos;

public record CreateUserRequest(string Username, string Password, string? Email, bool IsAdmin);

public record UpdateUserRequest(string? Email, bool? IsAdmin, bool? IsDisabled, string? NewPassword);
