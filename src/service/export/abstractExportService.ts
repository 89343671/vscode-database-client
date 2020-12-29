import * as vscode from "vscode";
import { ExportService } from "./exportService";
import { FieldInfo } from "mysql2";
import * as fs from "fs";
import { Console } from "../../common/Console";
import { ExportContext, ExportType } from "./exportContext";
import { ProgressLocation } from "vscode";

export abstract class AbstractExportService implements ExportService {

    public export(context: ExportContext): void {
        const randomFileName = `${new Date().getTime()}.${context.type}`

        vscode.window.showSaveDialog({ saveLabel: "Select export file path", defaultUri: vscode.Uri.file(randomFileName), filters: { 'file': [context.type] } }).then((filePath) => {
            if (filePath) {
                context.exportPath = filePath.fsPath;
                if (context.withOutLimit) {
                    context.sql = context.sql.replace(/\blimit\b.+/gi, "")
                }
                vscode.window.withProgress({ title: `Start exporting data to ${context.type}...`, location: ProgressLocation.Notification },  () => {
                    return new Promise((resolve)=>{
                        context.done=resolve
                        this.exportData(context)
                    })
                })
            }
        })
    }


    protected abstract exportData(exportOption: ExportContext): void;

    protected delegateExport(context: ExportContext, rows: any, fields: FieldInfo[]) {
        const filePath = context.exportPath;
            switch (context.type) {
                case ExportType.excel:
                    this.exportByNodeXlsx(filePath, fields, rows);
                    break;
                case ExportType.csv:
                    this.exportToCsv(filePath, fields, rows);
                    break;
                case ExportType.sql:
                    this.exportToSql(context);
                    break;
            }
            context.done()
            vscode.window.showInformationMessage(`export ${context.type} success, path is ${context.exportPath}!`, 'Open').then(action => {
                if (action) {
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(context.exportPath));
                }
            })
        
    }

    private exportToSql(exportContext: ExportContext) {

        const { rows, exportPath } = exportContext;
        if (rows.length == 0) {
            // show waraing
            return;
        }

        let sql = ``;
        for (const row of rows) {
            let columns = "";
            let values = "";
            for (const key in row) {
                columns += `\`${key}\`,`
                values += `'${row[key]}',`
            }
            sql += `insert into ${exportContext.table}(${columns.replace(/.$/, '')}) values(${values.replace(/.$/, '')});\n`
        }
        fs.writeFileSync(exportPath, sql);


    }

    private exportByNodeXlsx(filePath: string, fields: FieldInfo[], rows: any) {
        const nodeXlsx = require('node-xlsx');
        fs.writeFileSync(filePath, nodeXlsx.build([{
            name: "sheet1",
            data: [
                fields.map((field) => field.name),
                ...rows.map((row) => {
                    const values = [];
                    for (const key in row) {
                        values.push(row[key]);
                    }
                    return values;
                })
            ]
        }]), "binary");
    }

    private exportToCsv(filePath: string, fields: FieldInfo[], rows: any) {
        let csvContent = "";
        for (const row of rows) {
            for (const key in row) {
                csvContent += `${row[key]},`
            }
            csvContent = csvContent.replace(/.$/, "") + "\n"
        }
        fs.writeFileSync(filePath, csvContent);
    }


}