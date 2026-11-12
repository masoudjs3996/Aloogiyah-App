using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;

namespace AlooGiyah_Api.Authorization;

// Manager is the highest role. This only satisfies role requirements; authentication,
// ownership checks and other policies still apply independently.
public sealed class ManagerRoleHandler : AuthorizationHandler<RolesAuthorizationRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, RolesAuthorizationRequirement requirement)
    {
        if (context.User.Identity?.IsAuthenticated == true && context.User.IsInRole("Manager")) context.Succeed(requirement);
        return Task.CompletedTask;
    }
}
