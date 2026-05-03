using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WineApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWineDataTannins : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Tannins",
                table: "WineData",
                type: "text",
                nullable: true);

            migrationBuilder.Sql(@"UPDATE ""WineData"" SET ""Refetch"" = TRUE;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Tannins",
                table: "WineData");
        }
    }
}
