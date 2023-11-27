import { Workbook } from "exceljs";
import { createReadStream, readdirSync } from "fs";
import { writeFile } from "fs/promises";
import path = require("path");
import { createInterface } from "readline";

async function bootstrap(): Promise<void> {
  const sourceDir = path.join(__dirname, "../public/srt");
  const targetDir = path.join(__dirname, "../dist/excel");
  readdirSync(sourceDir)
    .filter((file) => file.endsWith(".srt"))
    .forEach((file) => {
      const rl = createInterface({
        input: createReadStream(path.join(sourceDir, file)),
        crlfDelay: Infinity,
      });
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet("Sheet1");
      worksheet.addRow(["id", "start", "end", "text"]);

      rl.on("line", async (line) => {
        if (line === "") {
          return;
        }

        if (!Number.isNaN(Number(line))) {
          worksheet.addRow([line]);
        }

        if (line.includes("-->")) {
          const start = line.split("-->")[0];
          const end = line.split("-->")[1];
          worksheet.lastRow.getCell(2).value = start;
          worksheet.lastRow.getCell(3).value = end;
        }

        worksheet.lastRow.getCell(4).value = line;
      });

      rl.on("close", async () => {
        await writeFile(path.join(targetDir, `${file.split(".")[0]}.xlsx`), "");
        let maxLengths = [];
        worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
          row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
            const length = cell.value ? cell.value.toString().length : 0;
            maxLengths[colNumber - 1] = Math.max(
              maxLengths[colNumber - 1] || 0,
              length
            );
          });
        });

        maxLengths
          .map((length) => length + 2)
          .forEach((length, i) => {
            worksheet.getColumn(i + 1).width = length;
          });
        await workbook.xlsx.writeFile(
          path.join(targetDir, `${file.split(".")[0]}.xlsx`)
        );
        console.log("File reading completed.");
      });
    });
  // // create file
  // let maxLengths = [];
  // worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
  //   row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
  //     const length = cell.value ? cell.value.toString().length : 0;
  //     maxLengths[colNumber - 1] = Math.max(
  //       maxLengths[colNumber - 1] || 0,
  //       length
  //     );
  //   });
  // });

  // maxLengths
  //   .map((length) => length + 2)
  //   .forEach((length, i) => {
  //     worksheet.getColumn(i + 1).width = length;
  //   });
}

bootstrap().catch((err) => console.error(err));
