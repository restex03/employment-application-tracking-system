using Eats.Ingestion.Infrastructure.Logging;
using Serilog;
using Serilog.Events;
using Serilog.Sinks.OpenTelemetry;

namespace Eats.Ingestion.Infrastructure.Configuration;

public static class LoggingServiceCollectionExtensions
{
    public static IServiceCollection AddLoggingServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        // Console presentation and OTLP export are independent Serilog sinks.
        services.AddSerilog((_, logger) =>
        {
            var levelName = configuration["Serilog:MinimumLevel:Default"] ?? "Information";
            if (!Enum.TryParse<LogEventLevel>(levelName, true, out var defaultLevel))
            {
                throw new InvalidOperationException($"Invalid Serilog minimum level: {levelName}");
            }

            logger.MinimumLevel.Is(defaultLevel);

            foreach (var overrideSection in configuration
                .GetSection("Serilog:MinimumLevel:Override").GetChildren())
            {
                if (!Enum.TryParse<LogEventLevel>(overrideSection.Value, true, out var overrideLevel))
                {
                    throw new InvalidOperationException(
                        $"Invalid Serilog minimum level override for {overrideSection.Key}");
                }

                logger.MinimumLevel.Override(overrideSection.Key, overrideLevel);
            }

            logger
                .Enrich.FromLogContext()
                .WriteTo.Console(new SingleLineConsoleFormatter(
                    configuration.GetValue<bool>("Serilog:Console:IncludeExceptionDetails")));

            var endpoint = configuration["Telemetry:OtlpEndpoint"];
            if (!string.IsNullOrWhiteSpace(endpoint))
            {
                logger.WriteTo.OpenTelemetry(options =>
                {
                    options.Endpoint = endpoint;
                    options.Protocol = OtlpProtocol.HttpProtobuf;
                    options.ResourceAttributes = new Dictionary<string, object>
                    {
                        ["service.name"] = "eats-ingestion",
                        ["deployment.environment.name"] = environment.EnvironmentName
                    };
                });
            }
        });

        return services;
    }
}
