import { ResourceManagementClient } from "azure-arm-resource";
import { ResourceGroupListStep as ResourceGroupListStepParent, IAzureNamingRules } from "vscode-azureextensionui";
import { IWizardResourceGroupWizardContext } from '../../models/wizard/wizard';


export const resourceGroupNamingRules: IAzureNamingRules = {
    minLength: 1,
    maxLength: 90,
    invalidCharsRegExp: /[^a-zA-Z0-9\.\_\-\(\)]/
};


export class ResourceGroupListStep extends ResourceGroupListStepParent<IWizardResourceGroupWizardContext> {
    private _suppressCreate: boolean | undefined;

    public constructor(suppressCreate?: boolean) {
        super();
        this._suppressCreate = suppressCreate;
    }


    public static async getResourceGroups<T extends IWizardResourceGroupWizardContext>(wizardContext: T) {
        
        if(wizardContext.resourceGroupsTask === undefined) {
            const client = new ResourceManagementClient(wizardContext.credentials, wizardContext.subscriptionId, wizardContext.credentials.environment?.resourceManagerEndpointUrl);
            wizardContext.resourceGroupsTask = uiUtils.listAll(client.resourceGroups, client.resourceGroups.list());
        }

        return await wizardContext.resourceGroupsTask;
    }

}


export namespace uiUtils {
    export interface IPartialList<T> extends Array<T> {
        nextLink?: string;
    }

    export async function listAll<T>(client: { listNext(nextPageLink: string): Promise<IPartialList<T>>; }, first: Promise<IPartialList<T>>): Promise<T[]> {
        const all: T[] = [];

        let list: IPartialList<T> = await first;
        all.push(...list);
        while (list.nextLink) {
            list = await client.listNext(list.nextLink);
            all.push(...list);
        }

        return all;
    }
}