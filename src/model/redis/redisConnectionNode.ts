import { Constants, ModelType } from "@/common/constants";
import { Util } from "@/common/util";
import { ViewManager } from "@/common/viewManager";
import { CommandKey, Node } from "@/model/interface/node";
import { NodeUtil } from "@/model/nodeUtil";
import * as path from "path";
import * as vscode from "vscode";
import { FolderNode } from "./folderNode";
import RedisBaseNode from "./redisBaseNode";

export class RedisConnectionNode extends RedisBaseNode {


    contextValue = ModelType.REDIS_CONNECTION;
    iconPath: string = path.join(Constants.RES_PATH, `image/redis_connection.png`);
    iconDetailPath: string = path.join(Constants.RES_PATH, `image/code-terminal.svg`);

    constructor(readonly key: string, readonly parent: Node) {
        super(key)
        this.init(parent)
        if (parent.name) {
            this.description=parent.name
            this.name = parent.name
        }
        this.label = this.uid
        if (this.disable) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
            this.iconPath = path.join(Constants.RES_PATH, "icon/close.svg");
            return;
        }
    }

    async getChildren(): Promise<RedisBaseNode[]> {
        const client = await this.getClient()
        let keys: string[] = await client.keys(this.pattern)
        return FolderNode.buildChilds(this, keys)
    }
    async openTerminal(): Promise<any> {
        const client = await this.getClient()
        ViewManager.createWebviewPanel({
            splitView: true, title: `${this.host}@${this.port}`, preserveFocus: false,
            iconPath: this.iconDetailPath, path: "app",
            eventHandler: (handler) => {
                handler.on("init", () => {
                    handler.emit("route", 'terminal')
                }).on("route-terminal", async () => {
                    handler.emit("config", NodeUtil.removeParent(this))
                }).on("exec", async (content) => {
                    if (!content) {
                        return;
                    }
                    const splitCommand: string[] = content.replace(/ +/g, " ").split(' ')
                    const command = splitCommand.shift()
                    const reply=await client.send_command(command, splitCommand)
                    handler.emit("result", reply)
                }).on("exit", () => {
                    handler.panel.dispose()
                })
            }
        })
    }

    async showStatus(): Promise<any> {
        const client = await this.getClient()
        client.info((err, reply) => {
            ViewManager.createWebviewPanel({
                title: "Redis Server Status", splitView: false,
                path: "app",
                eventHandler: (handler) => {
                    handler.on("init", () => {
                        handler.emit("route", 'redisStatus')
                    }).on("route-redisStatus", async () => {
                        handler.emit("info", reply)
                    })
                }
            })
        })
    }

    public copyName() {
        Util.copyToBoard(this.host)
    }

    public async deleteConnection(context: vscode.ExtensionContext) {

        Util.confirm(`Are you want to Delete Connection ${this.label} ? `, async () => {
            this.indent({ command: CommandKey.delete })
        })

    }

}

