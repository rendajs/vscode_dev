import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";

let outputChannel : vscode.OutputChannel | null = null;;

export function activate(context: vscode.ExtensionContext) {
	const log = vscode.window.createOutputChannel("Renda-dev");
	outputChannel = log;

	const formatterDisposable = vscode.languages.registerDocumentFormattingEditProvider("javascript", {
		async provideDocumentFormattingEdits(document) {
			const cwd = path.dirname(document.fileName);
			const config = vscode.workspace.getConfiguration("renda-dev");
			let cmd = config.get("formatterCommand") as string;
			cmd = cmd.replaceAll("${formatFilePath}", document.fileName);
			let resultStr;
			try {
				resultStr = await exec(cmd, {
					cwd,
				});
			} catch (e) {
				log.appendLine(String(e));
				showOpenLogError("Failed to run renda-dev formatter.");
			}
			if (!resultStr) return [];
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
	context.subscriptions.push(formatterDisposable);
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
	});
}

async function showOpenLogError(message: string) {
	const buttons = [];
	if (outputChannel) {
		buttons.push("Show log");
	}
	const result = await vscode.window.showErrorMessage(message, ...buttons);
	if (result == "Show log") {
		outputChannel?.show();
	}
}
