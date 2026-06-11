# =========================
# Build stage
# =========================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

# Install Node.js
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

COPY . .

# Build Angular
WORKDIR /src/clientapp
RUN npm ci
RUN npm run build

# Copy Angular build into ASP.NET wwwroot
WORKDIR /src
RUN mkdir -p /src/wwwroot
RUN cp -r /src/clientapp/dist/clientapp/browser/* /src/wwwroot/

# Publish ASP.NET
RUN dotnet publish Betonator.csproj -c Release -o /app/publish

# =========================
# Runtime stage
# =========================
FROM mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "Betonator.dll"]