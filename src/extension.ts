import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";
import * as stream from "stream";

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
			const text = document.getText();
			const result = await exec(cmd, text, {cwd});
			if (!result.succes) {
				log.appendLine(result.stdout);
				log.appendLine(result.stderr);
				showOpenLogError("Failed to run renda-dev formatter.");
			}
			if (!result.stdout) return [];
			const firstLine = document.lineAt(0);
			const lastLine = document.lineAt(document.lineCount - 1);
			const fullRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
			return [vscode.TextEdit.replace(fullRange, result.stdout)];
		}
	});
	context.subscriptions.push(formatterDisposable);
}

interface ExecResult {
	succes: boolean;
	stdout: string;
	stderr: string;
}

function exec(cmd: string, stdin: string, options: cp.ExecOptions = {}) {

	return new Promise<ExecResult>((resolve, reject) => {
		const proc = cp.exec(cmd, options, (err, stdout, stderr) => {
			resolve({succes: !err, stdout, stderr});
		});
		if (!proc.stdin) {
			resolve({
				succes: false,
				stderr: "",
				stdout: "",
			});
			return;
		}
		const stdinStream = new stream.Readable();
		stdinStream.push(stdin);
		stdinStream.push(null);
		stdinStream.pipe(proc.stdin);
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
