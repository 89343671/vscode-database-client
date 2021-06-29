import { ModelType } from "@/common/constants";
import { UserGroup } from "@/model/database/userGroup";
import { Node } from "@/model/interface/node";
import { FunctionGroup } from "@/model/main/functionGroup";
import { ProcedureGroup } from "@/model/main/procedureGroup";
import { TableGroup } from "@/model/main/tableGroup";
import { TriggerGroup } from "@/model/main/triggerGroup";
import { ViewGroup } from "@/model/main/viewGroup";
import { ConnectionManager } from "@/service/connectionManager";

export class NodeFinder {

    public static async findNodes(suffix: string, ...types: ModelType[]): Promise<Node[]> {

        let lcp = ConnectionManager.tryGetConnection();
        if (!lcp) return [];

        if (suffix) {
            const connectcionid = lcp.getConnectId({ schema: suffix, withSchema: true });
            lcp = Node.nodeCache[connectcionid]
            if (!lcp) return []
        }

        let nodeList = []
        const groupNodes = await lcp.getChildren();
        for (const type of types) {
            switch (type) {
                case ModelType.SCHEMA:
                    if (!lcp || !lcp?.parent?.getChildren) { break; }
                    const databaseNodes = await lcp.parent.getChildren()
                    nodeList.push(...databaseNodes.filter(databaseNodes => !(databaseNodes instanceof UserGroup)))
                    break;
                case ModelType.TABLE:
                    nodeList.push(...await groupNodes.find(n => n instanceof TableGroup).getChildren())
                    break;
                case ModelType.VIEW:
                    nodeList.push(...await groupNodes.find(n => n instanceof ViewGroup).getChildren())
                    break;
                case ModelType.PROCEDURE:
                    nodeList.push(...await groupNodes.find(n => n instanceof ProcedureGroup).getChildren())
                    break;
                case ModelType.TRIGGER:
                    nodeList.push(...await groupNodes.find(n => n instanceof TriggerGroup).getChildren())
                    break;
                case ModelType.FUNCTION:
                    nodeList.push(...await groupNodes.find(n => n instanceof FunctionGroup).getChildren())
                    break;
            }
        }
        return nodeList;
    }

}