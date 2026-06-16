using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WineApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class DropWineDataForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DrinkLogs_WineData_Barcode",
                table: "DrinkLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_FavoriteWines_WineData_Barcode",
                table: "FavoriteWines");

            migrationBuilder.DropForeignKey(
                name: "FK_WineNotes_WineData_Barcode",
                table: "WineNotes");

            migrationBuilder.DropIndex(
                name: "IX_WineNotes_Barcode",
                table: "WineNotes");

            migrationBuilder.DropIndex(
                name: "IX_FavoriteWines_Barcode",
                table: "FavoriteWines");

            migrationBuilder.DropIndex(
                name: "IX_DrinkLogs_Barcode",
                table: "DrinkLogs");

            migrationBuilder.AlterColumn<string>(
                name: "Barcode",
                table: "WineNotes",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Barcode",
                table: "FavoriteWines",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Barcode",
                table: "DrinkLogs",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Barcode",
                table: "WineNotes",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Barcode",
                table: "FavoriteWines",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Barcode",
                table: "DrinkLogs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateIndex(
                name: "IX_WineNotes_Barcode",
                table: "WineNotes",
                column: "Barcode");

            migrationBuilder.CreateIndex(
                name: "IX_FavoriteWines_Barcode",
                table: "FavoriteWines",
                column: "Barcode");

            migrationBuilder.CreateIndex(
                name: "IX_DrinkLogs_Barcode",
                table: "DrinkLogs",
                column: "Barcode");

            migrationBuilder.AddForeignKey(
                name: "FK_DrinkLogs_WineData_Barcode",
                table: "DrinkLogs",
                column: "Barcode",
                principalTable: "WineData",
                principalColumn: "Barcode",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_FavoriteWines_WineData_Barcode",
                table: "FavoriteWines",
                column: "Barcode",
                principalTable: "WineData",
                principalColumn: "Barcode",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WineNotes_WineData_Barcode",
                table: "WineNotes",
                column: "Barcode",
                principalTable: "WineData",
                principalColumn: "Barcode",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
