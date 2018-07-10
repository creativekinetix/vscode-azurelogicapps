import LogicManagementClient = require("azure-arm-logic");
import { Workflow } from "azure-arm-logic/lib/models";
import { IAzureNode } from "vscode-azureextensionui";
import { ext } from '../extensionVariables';
import { WorkflowCodeViewTreeItem } from '../tree/WorkflowCodeViewTreeItem';
import { WorkflowRunTreeItem } from "../tree/WorkflowRunTreeItem";
import { IWorkflowEditor } from "./WorkflowEditorManager";

export class RunCodeViewEditor implements IWorkflowEditor<Workflow> {
    private _node: IAzureNode<WorkflowRunTreeItem>;
    constructor(node: IAzureNode<WorkflowRunTreeItem>) {
        this._node = node;
    }

    public get label(): string {
        return this._node.id + 'xyz';
    }

    public async getData(): Promise<Workflow> {
        return this._node.treeItem._workflowRun;
    }

    public async update(workflow: any): Promise<WorkflowRun> {
        const x = workflow;

        const client: LogicManagementClient = ext.client;

        this._node.treeItem._workflowRun = workflow;

        //const foo = await client.workflows.createOrUpdate(this._node.treeItem._workflowRun.id.split('/')[4], this._node.treeItem._workflowRun.name, this._node.treeItem._workflowRun);

        return foo.definition;

        //return await client.workflows.createOrUpdate()

        //return await this._node.treeItem.update(document);
    }

    public get id(): string {
        return 'w';
    }

    public convertFromString(data: string): Workflow {
        return JSON.parse(data);
    }

    public convertToString(data: Workflow): string {
        return JSON.stringify(data, null, 2);
    }
}