using Betonator.Domain;
using Microsoft.EntityFrameworkCore;

namespace Betonator.Data;

public class BetonatorDbContext(DbContextOptions<BetonatorDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Competition> Competitions => Set<Competition>();
    public DbSet<CompetitionParticipant> CompetitionParticipants => Set<CompetitionParticipant>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<Match> Matches => Set<Match>();
    public DbSet<Bet> Bets => Set<Bet>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.Property(u => u.Username).IsRequired().HasMaxLength(64);
            e.Property(u => u.PasswordHash).IsRequired().HasMaxLength(128);
            e.Property(u => u.Email).HasMaxLength(256);
            e.HasIndex(u => u.Username).IsUnique();
        });

        b.Entity<Competition>(e =>
        {
            e.Property(c => c.Name).IsRequired().HasMaxLength(200);
        });

        b.Entity<CompetitionParticipant>(e =>
        {
            e.HasKey(p => new { p.UserId, p.CompetitionId });
            e.HasOne(p => p.User)
                .WithMany(u => u.Participations)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(p => p.Competition)
                .WithMany(c => c.Participants)
                .HasForeignKey(p => p.CompetitionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Group>(e =>
        {
            e.Property(g => g.Name).IsRequired().HasMaxLength(64);
            e.HasIndex(g => new { g.CompetitionId, g.Name }).IsUnique();
            e.HasOne(g => g.Competition)
                .WithMany(c => c.Groups)
                .HasForeignKey(g => g.CompetitionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Match>(e =>
        {
            e.Property(m => m.Team1).IsRequired().HasMaxLength(64);
            e.Property(m => m.Team2).IsRequired().HasMaxLength(64);
            e.Property(m => m.Description).HasMaxLength(100);
            e.Property(m => m.ResultDescription).HasMaxLength(500);
            e.Property(m => m.Stage).HasConversion<int?>();
            e.HasIndex(m => new { m.CompetitionId, m.GameTime });
            e.HasIndex(m => new { m.CompetitionId, m.Stage, m.BracketPosition });
            e.HasOne(m => m.Competition)
                .WithMany(c => c.Matches)
                .HasForeignKey(m => m.CompetitionId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(m => m.Group)
                .WithMany(g => g.Matches)
                .HasForeignKey(m => m.GroupId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(m => m.FeederMatch1)
                .WithMany()
                .HasForeignKey(m => m.FeederMatch1Id)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(m => m.FeederMatch2)
                .WithMany()
                .HasForeignKey(m => m.FeederMatch2Id)
                .OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<Bet>(e =>
        {
            e.HasIndex(x => new { x.MatchId, x.UserId }).IsUnique();
            // SQLite has no native rowversion; we maintain the token ourselves in SaveChanges.
            e.Property(x => x.RowVersion).IsConcurrencyToken();
            e.HasOne(x => x.Match)
                .WithMany(m => m.Bets)
                .HasForeignKey(x => x.MatchId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User)
                .WithMany(u => u.Bets)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    public override int SaveChanges()
    {
        BumpRowVersions();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        BumpRowVersions();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void BumpRowVersions()
    {
        // SQLite doesn't generate rowversion automatically; assign a fresh token on insert/update.
        foreach (var entry in ChangeTracker.Entries<Bet>())
        {
            if (entry.State is EntityState.Added or EntityState.Modified)
            {
                entry.Entity.RowVersion = BitConverter.GetBytes(DateTime.UtcNow.Ticks);
            }
        }
    }
}
