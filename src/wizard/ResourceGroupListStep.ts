import { ResourceManagementClient } from "azure-arm-resource";
import { IAzureNamingRules, IAzureQuickPickItem, IAzureQuickPickOptions, AzureWizardPromptStep, IAzureUserInput, AzureUserInput, LocationListStep, ResourceGroupCreateStep, IActionContext, AzureWizardExecuteStep } from "vscode-azureextensionui";
import { IWizardResourceGroupWizardContext, IWizardContext } from "../models/wizard/wizard";
import { ResourceGroup } from "azure-arm-resource/lib/resource/models";
import * as nls from 'vscode-nls';
import { ext } from '../extensionVariables';
import { ResourceGroupNameStep } from "./logic-app/ResourceGroupNameStep";


export const resourceGroupNamingRules: IAzureNamingRules = {
    minLength: 1,
    maxLength: 90,
    invalidCharsRegExp: /[^a-zA-Z0-9\.\_\-\(\)]/
};


export class ResourceGroupListStep<T extends IWizardResourceGroupWizardContext> extends AzureWizardPromptStep<T> implements ResourceGroupListStep<T> {
    
    private _suppressCreate: boolean | undefined;

    public constructor(suppressCreate?: boolean) {
        super();
        this._suppressCreate = suppressCreate;
    }

    public static async getResourceGroups<T extends IWizardResourceGroupWizardContext>(wizardContext: T) {
        
        const baseUri: string | undefined = wizardContext.credentials.environment?.resourceManagerEndpointUrl;

        if(wizardContext.resourceGroupsTask === undefined) {
            const client = new ResourceManagementClient(wizardContext.credentials, wizardContext.subscriptionId, baseUri);
            wizardContext.resourceGroupsTask = uiUtils.listAll(client.resourceGroups, client.resourceGroups.list());
        }

        return await wizardContext.resourceGroupsTask;
    }

    public static async isNameAvailable<T extends IWizardResourceGroupWizardContext>(wizardContext: T, name: string): Promise<boolean> {
        const resourceGroupsTask: Promise<ResourceGroup[]> = ResourceGroupListStep.getResourceGroups(wizardContext);
        return !(await resourceGroupsTask).some((rg: ResourceGroup) => rg.name !== undefined && rg.name.toLowerCase() === name.toLowerCase());
    }


    public async prompt(wizardContext: T): Promise<T> {
        // Cache resource group separately per subscription
        const options: IAzureQuickPickOptions = { placeHolder: 'Select a resource group for new resources.', id: `ResourceGroupListStep/${wizardContext.subscriptionId}` };
        wizardContext.resourceGroup = (await ext.ui.showQuickPick(this.getQuickPicks(wizardContext), options)).data;
        return wizardContext;
    }


    public async getSubWizard(wizardContext: T): Promise<IWizardOptions<T> | undefined> {
        if (!wizardContext.resourceGroup) {
            const promptSteps: AzureWizardPromptStep<T>[] = [new ResourceGroupNameStep()];
            // LocationListStep.addStep(wizardContext, promptSteps);

            if (!wizardContext._alreadyHasLocationStep) {
                promptSteps.push(new LocationListStep());
                wizardContext._alreadyHasLocationStep = true;
            }

            return {
                promptSteps,
                executeSteps: [new ResourceGroupCreateStep()]
            };
        } else {
            return undefined;
        }
    }

    public shouldPrompt(wizardContext: T): boolean {
        return !wizardContext.resourceGroup && !wizardContext.newResourceGroupName;
    }



    private async getQuickPicks(wizardContext: T): Promise<IAzureQuickPickItem<ResourceGroup | undefined>[]> {
        const picks: IAzureQuickPickItem<ResourceGroup | undefined>[] = [];

        if (!this._suppressCreate) {
            picks.push({
                label: localize('NewResourceGroup', '$(plus) Create new resource group'),
                description: '',
                data: undefined
            });
        }

        const resourceGroups: ResourceGroup[] = await ResourceGroupListStep.getResourceGroups(wizardContext);
        return picks.concat(resourceGroups.map((rg: ResourceGroup) => {
            return {
                id: rg.id,
                // tslint:disable-next-line:no-non-null-assertion
                label: rg.name!,
                description: rg.location,
                data: rg
            };
        }));
    }

}

export const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export namespace uiUtils {
    export interface IPartialList<T> extends Array<T> {
        nextLink?: string;
    }

    export async function listAll<T>(client: { listNext(nextPageLink: string): Promise<IPartialList<T>> }, first: Promise<IPartialList<T>>): Promise<T[]> {
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

export interface IWizardOptions<T> {
    /**
     * The steps to prompt for user input, in order
     */
    promptSteps?: AzureWizardPromptStep<T>[];

    /**
     * The steps to execute, in order
     */
    executeSteps?: AzureWizardExecuteStep<T>[];

    /**
     * A title used when prompting
     */
    title?: string;

    /**
     * If true, step count will not be displayed for the entire wizard. Defaults to false.
     */
    hideStepCount?: boolean;
}