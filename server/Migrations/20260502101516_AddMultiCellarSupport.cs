using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WineApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiCellarSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_CellarEntries",
                table: "CellarEntries");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "CellarEntries");

            migrationBuilder.AddColumn<int>(
                name: "CellarId",
                table: "CellarEntries",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_CellarEntries",
                table: "CellarEntries",
                columns: new[] { "CellarId", "Barcode" });

            migrationBuilder.CreateTable(
                name: "Cellars",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    OwnerId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cellars", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cellars_Users_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CellarMembers",
                columns: table => new
                {
                    CellarId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CellarMembers", x => new { x.CellarId, x.UserId });
                    table.ForeignKey(
                        name: "FK_CellarMembers_Cellars_CellarId",
                        column: x => x.CellarId,
                        principalTable: "Cellars",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CellarMembers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CellarShareTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Token = table.Column<string>(type: "text", nullable: false),
                    CellarId = table.Column<int>(type: "integer", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsUsed = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CellarShareTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CellarShareTokens_Cellars_CellarId",
                        column: x => x.CellarId,
                        principalTable: "Cellars",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CellarMembers_UserId",
                table: "CellarMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Cellars_OwnerId",
                table: "Cellars",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_CellarShareTokens_CellarId",
                table: "CellarShareTokens",
                column: "CellarId");

            migrationBuilder.CreateIndex(
                name: "IX_CellarShareTokens_Token",
                table: "CellarShareTokens",
                column: "Token",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_CellarEntries_Cellars_CellarId",
                table: "CellarEntries",
                column: "CellarId",
                principalTable: "Cellars",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CellarEntries_Cellars_CellarId",
                table: "CellarEntries");

            migrationBuilder.DropTable(
                name: "CellarMembers");

            migrationBuilder.DropTable(
                name: "CellarShareTokens");

            migrationBuilder.DropTable(
                name: "Cellars");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CellarEntries",
                table: "CellarEntries");

            migrationBuilder.DropColumn(
                name: "CellarId",
                table: "CellarEntries");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "CellarEntries",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CellarEntries",
                table: "CellarEntries",
                columns: new[] { "UserId", "Barcode" });
        }
    }
}
