import * as vscode from 'vscode';

const MATCHER = /^statement ok[^\n]*\n(CREATE|INSERT|CANCEL)|^query [ITRBO]+[^\n]*\nSELECT/mi;

export function activate(context: vscode.ExtensionContext) {
    const maybeSetSqllogictest = (doc: vscode.TextDocument) => {
        // If a user manually changes the language mode to "plaintext" on a file
        // we've detected as a sqllogictest file, we don't want to force the
        // mode back to "sqllogictest". Unfortunately, a user changing the
        // language mode is indistinguishable from a user closing and reopening
        // the file, and in the latter case we *do* want to put the file into
        // "sqllogictest" mode. So we employ a cheap hack: checking to see
        // how long it's been since the file was closed. Changing the language
        // will cause the file to be reopened in just a few milliseconds; it's
        // very difficult as the user to close and reopen a file in that time.
        // The threshold is set to 50ms based on some empirical data.
        let closedAt = context.workspaceState.get(doc.fileName) as number | undefined;
        let closedRecently = (closedAt && closedAt + 50 >= Date.now());
        if (closedRecently || doc.languageId !== "plaintext") {
            return;
        }
        const range = new vscode.Range(1, 1, 100, 1);
        const snippet = doc.getText(range);
        if (MATCHER.test(snippet)) {
            vscode.languages.setTextDocumentLanguage(doc, "sqllogictest");
        }
    };
    vscode.workspace.textDocuments.forEach(maybeSetSqllogictest);
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(maybeSetSqllogictest));
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(maybeSetSqllogictest));
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => {
        context.workspaceState.update(doc.fileName, Date.now());
    }));
}

export function deactivate() {}
