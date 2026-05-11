using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WineApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class NullableLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_Entries",
                table: "Entries");

            migrationBuilder.DropColumn(
                name: "IsDefault",
                table: "Locations");

            migrationBuilder.AlterColumn<int>(
                name: "LocationId",
                table: "Entries",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "Id",
                table: "Entries",
                type: "integer",
                nullable: false,
                defaultValue: 0)
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddColumn<int>(
                name: "HomeId",
                table: "Entries",
                type: "integer",
                nullable: true,
                defaultValue: null);

            // Populate HomeId from the Location relationship for existing rows
            migrationBuilder.Sql(@"
                UPDATE ""Entries"" e
                SET ""HomeId"" = l.""HomeId""
                FROM ""Locations"" l
                WHERE e.""LocationId"" = l.""Id""
            ");

            migrationBuilder.AlterColumn<int>(
                name: "HomeId",
                table: "Entries",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Entries",
                table: "Entries",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_Entries_HomeId_Barcode",
                table: "Entries",
                columns: new[] { "HomeId", "Barcode" },
                unique: true,
                filter: "\"LocationId\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Entries_HomeId_Barcode_LocationId",
                table: "Entries",
                columns: new[] { "HomeId", "Barcode", "LocationId" },
                unique: true,
                filter: "\"LocationId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Entries_LocationId",
                table: "Entries",
                column: "LocationId");

            migrationBuilder.AddForeignKey(
                name: "FK_Entries_Homes_HomeId",
                table: "Entries",
                column: "HomeId",
                principalTable: "Homes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Entries_Homes_HomeId",
                table: "Entries");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Entries",
                table: "Entries");

            migrationBuilder.DropIndex(
                name: "IX_Entries_HomeId_Barcode",
                table: "Entries");

            migrationBuilder.DropIndex(
                name: "IX_Entries_HomeId_Barcode_LocationId",
                table: "Entries");

            migrationBuilder.DropIndex(
                name: "IX_Entries_LocationId",
                table: "Entries");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "Entries");

            migrationBuilder.DropColumn(
                name: "HomeId",
                table: "Entries");

            migrationBuilder.AddColumn<bool>(
                name: "IsDefault",
                table: "Locations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<int>(
                name: "LocationId",
                table: "Entries",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Entries",
                table: "Entries",
                columns: new[] { "LocationId", "Barcode" });
        }
    }
}
