import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.languages.registerDocumentFormattingEditProvider("javascript", {
		async provideDocumentFormattingEdits(document) {
			const cwd = path.dirname(document.fileName);
			const resultStr = await exec(`deno task lint-fix --ide-extension-file=${document.fileName}`, {
				cwd,
			});
			const result = JSON.parse(resultStr);
			if (result.output == undefined) {
				return [];
			} else {
				const firstLine = document.lineAt(0);
				const lastLine = document.lineAt(document.lineCount - 1);
				const fullRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
				return [vscode.TextEdit.replace(fullRange, result.output)];
			}
		}
	});

	context.subscriptions.push(disposable);
}

function exec(cmd: string, options: cp.ExecOptions = {}) {
	return new Promise<string>((resolve, reject) => {
		cp.exec(cmd, options, (err, stdout, stderr) => {
			if (err) {
				reject(err);
			} else {
				resolve(stdout);
			}
		});
	})
}
