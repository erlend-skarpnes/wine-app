using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WineApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDrinkLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DrinkLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    HomeId = table.Column<int>(type: "integer", nullable: false),
                    Barcode = table.Column<string>(type: "text", nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    DrankAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DrinkLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DrinkLogs_Homes_HomeId",
                        column: x => x.HomeId,
                        principalTable: "Homes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DrinkLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DrinkLogs_WineData_Barcode",
                        column: x => x.Barcode,
                        principalTable: "WineData",
                        principalColumn: "Barcode",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DrinkLogs_Barcode",
                table: "DrinkLogs",
                column: "Barcode");

            migrationBuilder.CreateIndex(
                name: "IX_DrinkLogs_HomeId",
                table: "DrinkLogs",
                column: "HomeId");

            migrationBuilder.CreateIndex(
                name: "IX_DrinkLogs_UserId",
                table: "DrinkLogs",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DrinkLogs");
        }
    }
}
