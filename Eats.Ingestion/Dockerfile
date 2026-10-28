# Stage 1: Build application
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY . .

RUN dotnet publish \
    Eats.Ingestion/Eats.Ingestion.csproj \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false


# Stage 2: Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

# Install curl for Docker health checks
USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080

EXPOSE 8080

# Run application as non-root
USER $APP_UID

ENTRYPOINT ["dotnet", "Eats.Ingestion.dll"]