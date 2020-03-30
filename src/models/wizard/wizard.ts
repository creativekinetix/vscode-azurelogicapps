import { AzureEnvironment } from "ms-rest-azure";
import { ServiceClientCredentials } from "ms-rest";
import { ILocationWizardContext, IResourceGroupWizardContext } from "vscode-azureextensionui";

export interface IWizardCredentials extends ServiceClientCredentials {
    environment?: AzureEnvironment;
}

export interface IWizardContext extends ILocationWizardContext, IResourceGroupWizardContext {
    credentials: IWizardCredentials;
}


export interface IWizardResourceGroupWizardContext extends IWizardContext, IResourceGroupWizardContext {
    _alreadyHasLocationStep: boolean | undefined;
    version?: string;
    credentials: IWizardCredentials;
}
