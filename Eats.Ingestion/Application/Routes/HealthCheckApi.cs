using Microsoft.AspNetCore.Diagnostics.HealthChecks;

namespace Eats.Ingestion.Application.Routes;
public static class HealthCheckApi
{
    
    public static RouteGroupBuilder MapHealthCheckEndpoints(this RouteGroupBuilder group)
    {
        group.MapHealthChecks("/live", new HealthCheckOptions
        {
            Predicate = _ => false
        });

        group.MapHealthChecks("/ready", new HealthCheckOptions
        {
            Predicate = check => check.Tags.Contains("ready"),
        });
        return group;
    }

}