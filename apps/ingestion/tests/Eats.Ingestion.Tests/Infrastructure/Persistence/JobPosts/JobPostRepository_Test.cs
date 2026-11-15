using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Eats.Ingestion.Tests.Infrastructure.Persistence.JobPosts;

public sealed class JobPostRepositoryTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task PersistHydrationAsync_UpdatesDetachedPostAndAddsNewDetail(bool hydrate)
    {
        var post = CreateJobPost(hydrate);
        using var cancellation = new CancellationTokenSource();
        var saveCount = 0;
        var interceptor = new HydrationSaveInterceptor((context, token) =>
        {
            saveCount++;
            Assert.Equal(cancellation.Token, token);
            Assert.Equal(EntityState.Modified, context.Entry(post).State);
            Assert.All(context.Entry(post).Properties.Where(property => !property.Metadata.IsPrimaryKey()),
                property => Assert.True(property.IsModified));
            if (hydrate)
            {
                Assert.Equal(EntityState.Added, context.Entry(post.Detail!).State);
                Assert.Equal(post.Id, post.Detail!.JobPostId);
            }
            else
            {
                Assert.True(post.ExcludeFromPublication);
                Assert.Empty(context.ChangeTracker.Entries<JobPostDetail>());
            }
        });
        await using var context = CreateContext(interceptor);
        var unrelatedPost = CreateJobPost(false);
        context.Attach(unrelatedPost);
        var repository = new JobPostRepository(context);
        Assert.Equal(EntityState.Detached, context.Entry(post).State);

        await repository.PersistHydrationAsync(post, cancellation.Token);

        Assert.Equal(1, saveCount);
        Assert.Equal(EntityState.Detached, context.Entry(post).State);
        if (post.Detail is not null)
        {
            Assert.Equal(EntityState.Detached, context.Entry(post.Detail).State);
        }
        Assert.Equal(EntityState.Unchanged, context.Entry(unrelatedPost).State);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task PersistHydrationAsync_DetachesFailedChangesBeforeNextSave(bool hydrate)
    {
        var failure = new DbUpdateException("Save failed.");
        var interceptor = new HydrationSaveInterceptor((_, _) => throw failure);
        await using var context = CreateContext(interceptor);
        var repository = new JobPostRepository(context);
        var post = CreateJobPost(hydrate);

        var exception = await Assert.ThrowsAsync<DbUpdateException>(
            () => repository.PersistHydrationAsync(post));

        Assert.Same(failure, exception);
        Assert.Empty(context.ChangeTracker.Entries());
    }

    [Fact]
    public async Task PersistHydrationAsync_RejectsCancellationBeforeTracking()
    {
        var interceptor = new HydrationSaveInterceptor((_, _) => Assert.Fail("Saving should not be attempted."));
        await using var context = CreateContext(interceptor);
        var repository = new JobPostRepository(context);
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => repository.PersistHydrationAsync(CreateJobPost(true), cancellation.Token));

        Assert.Empty(context.ChangeTracker.Entries());
    }

    private static EatsIngestionDbContext CreateContext(HydrationSaveInterceptor interceptor) =>
        new(new DbContextOptionsBuilder<EatsIngestionDbContext>()
            .UseNpgsql("Host=localhost;Database=unused")
            .AddInterceptors(interceptor)
            .Options);

    private static JobPost CreateJobPost(bool hydrate)
    {
        var post = new JobPost(
            Guid.NewGuid(), Guid.NewGuid(), "Software Engineer", "/jobs/123",
            DateTime.UtcNow, new Uri("https://example.com/jobs/123"));
        if (hydrate)
        {
            post.HydrateDetail(new JobPostDetailDiscovery(
                "Description", "REQ-123", "Software Engineer", "Remote",
                FetchedAt: DateTime.UtcNow));
        }
        else
        {
            post.Exclude();
        }

        return post;
    }

    private sealed class HydrationSaveInterceptor(Action<DbContext, CancellationToken> onSaving)
        : SaveChangesInterceptor
    {
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            onSaving(eventData.Context!, cancellationToken);
            return ValueTask.FromResult(InterceptionResult<int>.SuppressWithResult(1));
        }
    }
}
