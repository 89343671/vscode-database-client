import { CacheKey } from "@/common/constants";
import { Global } from "@/common/global";
import * as vscode from "vscode";
import { HistoryNode } from "./historyNode";

export class HistoryProvider implements vscode.TreeDataProvider<HistoryNode>{

    public static _onDidChangeTreeData: vscode.EventEmitter<HistoryNode> = new vscode.EventEmitter<HistoryNode>();
    public readonly onDidChangeTreeData: vscode.Event<HistoryNode> = HistoryProvider._onDidChangeTreeData.event;
    constructor(protected context: vscode.ExtensionContext) {
    }

    getTreeItem(element: HistoryNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    getChildren(element?: HistoryNode): vscode.ProviderResult<HistoryNode[]> {
        let globalHistories = this.context.globalState.get<Array<HistoryNode>>(CacheKey.GLOBAL_HISTORY, []);
        return globalHistories.map(history => {
            return new HistoryNode(history.sql, history.date, history.costTime)
        })
    }
    getParent?(element: HistoryNode): vscode.ProviderResult<HistoryNode> {
        return null;
    }

    public static recordHistory(historyNode: HistoryNode) {
        let glboalHistoryies = Global.context.globalState.get<Array<HistoryNode>>(CacheKey.GLOBAL_HISTORY, []);
        glboalHistoryies.unshift(historyNode)
        if(glboalHistoryies.length>100){
            glboalHistoryies=glboalHistoryies.splice(-1,1)
        }
        Global.context.globalState.update(CacheKey.GLOBAL_HISTORY, glboalHistoryies);
        HistoryProvider._onDidChangeTreeData.fire(null)
    }

}