using System.Net;
using System.Text.Json;
using Eats.Ingestion.Application.JobPosts.Models;
using Eats.Ingestion.Application.Routes;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace Eats.Ingestion.Tests.Application.JobPosts;

public sealed class JobPostSortBy_Test
{
    [Theory]
    [InlineData(JobPostSortBy.Values.CompanyName)]
    [InlineData(JobPostSortBy.Values.RequisitionId)]
    [InlineData(JobPostSortBy.Values.Title)]
    [InlineData(JobPostSortBy.Values.PostedDate)]
    public void TryParse_Preserves_The_Wire_Value(string value)
    {
        Assert.True(JobPostSortBy.TryParse(value, out var sortBy));
        Assert.Equal(value, sortBy.Value);
        Assert.Equal(value, sortBy.ToString());
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Title")]
    [InlineData("invalid")]
    [InlineData("jobMatchScore")]
    [InlineData("location")]
    [InlineData("locations")]
    [InlineData("applicationStatus")]
    [InlineData("title,location")]
    public void TryParse_Rejects_Unsupported_Values(string? value)
    {
        Assert.False(JobPostSortBy.TryParse(value, out var sortBy));
        Assert.Null(sortBy);
    }

    [Fact]
    public async Task Http_Binding_Parses_Valid_Fields_And_Rejects_Invalid_Fields_Before_Handler()
    {
        var service = new Mock<IJobPostService>(MockBehavior.Strict);
        var queries = new List<JobPostQuery>();
        service.Setup(s => s.ListAsync(It.IsAny<JobPostQuery>(), It.IsAny<CancellationToken>()))
            .Callback<JobPostQuery, CancellationToken>((query, _) => queries.Add(query))
            .ReturnsAsync(Array.Empty<JobPostDto>());
        service.Setup(s => s.CountAsync(It.IsAny<JobPostQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Logging.ClearProviders();
        builder.Services.AddSingleton(service.Object);
        await using var app = builder.Build();
        app.MapGroup("/jobPosts").MapJobPostApi();
        await app.StartAsync();
        try
        {
            using var client = new HttpClient { BaseAddress = new Uri(Assert.Single(app.Urls)) };
            const string path = "/jobPosts/?pageCount=10&pageNumber=1";
            foreach (var value in new[]
            {
                JobPostSortBy.CompanyName, JobPostSortBy.RequisitionId, JobPostSortBy.Title,
                JobPostSortBy.PostedDate
            })
            {
                using var response = await client.GetAsync($"{path}&sortBy={value}");
                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
                using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
                Assert.Equal(JsonValueKind.Array, json.RootElement.GetProperty("data").ValueKind);
                Assert.Equal(0, json.RootElement.GetProperty("totalCount").GetInt32());
                Assert.False(response.Headers.Contains("X-Total-Count"));
                Assert.Equal(value, queries.Last().SortBy);
            }

            using var defaultResponse = await client.GetAsync(path);
            Assert.Equal(HttpStatusCode.OK, defaultResponse.StatusCode);
            Assert.Equal(JobPostSortBy.PostedDate, queries.Last().SortBy ?? JobPostSortBy.PostedDate);
            Assert.Equal(SortDirection.Descending, queries.Last().SortDirection ?? SortDirection.Descending);
            foreach (var direction in new[] { SortDirection.Ascending, SortDirection.Descending })
            {
                using var response = await client.GetAsync($"{path}&sortDirection={direction}");
                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
                Assert.Equal(direction, queries.Last().SortDirection);
            }
            var successfulRequests = queries.Count;

            foreach (var invalid in new[] { "", "invalid", "Title", "jobMatchScore", "applicationStatus", "location", "locations", "title,location" })
            {
                using var response = await client.GetAsync($"{path}&sortBy={Uri.EscapeDataString(invalid)}");
                Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            }
            foreach (var invalid in new[] { "", "invalid", "dsc", "ASC", "asc,desc" })
            {
                using var response = await client.GetAsync($"{path}&sortDirection={Uri.EscapeDataString(invalid)}");
                Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            }
            Assert.Equal(successfulRequests, queries.Count);
        }
        finally
        {
            await app.StopAsync();
        }
    }
}
