using Eats.Ingestion.Application.JobPosts.Models;
using Eats.Ingestion.Application.Routes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace Eats.Ingestion.Tests.Application.JobPosts;

public sealed class JobPostApi_Test
{
    [Fact]
    public async Task List_Returns_Data_And_TotalCount_Envelope()
    {
        var service = new Mock<IJobPostService>();
        var query = Query();
        service.Setup(s => s.ListAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<JobPostDto>());
        service.Setup(s => s.CountAsync(query, It.IsAny<CancellationToken>())).ReturnsAsync(75);
        var result = await JobPostApi.List(query, service.Object, NullLoggerFactory.Instance, CancellationToken.None);

        var response = Assert.IsType<Ok<JobPostListResponse>>(result);
        Assert.NotNull(response.Value);
        Assert.Empty(response.Value.Data);
        Assert.Equal(75, response.Value.TotalCount);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(10, 0)]
    [InlineData(-1, 1)]
    [InlineData(10, -1)]
    public async Task List_Rejects_Invalid_Pagination_Without_Querying(int pageCount, int pageNumber)
    {
        var service = new Mock<IJobPostService>(MockBehavior.Strict);
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => JobPostApi.List(
            Query(pageCount, pageNumber), service.Object,
            NullLoggerFactory.Instance, CancellationToken.None));

        Assert.Equal("queryParams", exception.ParamName);
        service.VerifyNoOtherCalls();
    }

    private static JobPostQuery Query(int pageCount = 10, int pageNumber = 1) => new()
    {
        PageCount = pageCount, PageNumber = pageNumber, CompanyName = null, RequisitionId = null, Title = null,
        Location = null, PostedDate = null, JobMatchScore = null, ApplicationStatus = null,
    };
}
