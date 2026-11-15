using Microsoft.AspNetCore.Http.HttpResults;

namespace Eats.Ingestion.Application.Routes;
public static class JobSourceApi
{
    public static RouteGroupBuilder MapJobSourceApi(this RouteGroupBuilder group)
    {
        group.MapGet("/{id}", GetById);
        group.MapGet("/", List);

        return group;
    }


    public static async Task<Ok<JobSourceDto>> GetById(IJobSourceService svc, Guid id) 
    {
        var result = await svc.GetByIdOrThrow(id);
        return TypedResults.Ok(result);    
    }


    public static async Task<Ok<IReadOnlyList<JobSourceDto>>> List(IJobSourceService svc, string? companyName)
    {
        var sources = !string.IsNullOrWhiteSpace(companyName)
            ? await svc.GetByCompanyName(companyName)
            : await svc.GetAll();
        return TypedResults.Ok(sources);
    
    }
}