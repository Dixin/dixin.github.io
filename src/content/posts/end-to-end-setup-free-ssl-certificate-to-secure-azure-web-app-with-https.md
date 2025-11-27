---
title: "End-to-End - Setup free SSL certificate to secure Azure Web App with HTTPS"
published: 2019-04-09
description: "It is 2019 now, and HTTP is considered as “not secure”, and HTTPS is the default. This is a end-to-end tutorial of how to setup SSL certificate to secure Azure Web App with HTTPS. It is based on “[Let"
image: ""
tags: ["ASP.NET Core", "Azure", "Cloud", "Encrypt", "HTTPS", "PowerShell", "Security", "SSL", "Web", "Website"]
category: "Azure"
draft: false
lang: ""
---

It is 2019 now, and HTTP is considered as “not secure”, and HTTPS is the default. This is a end-to-end tutorial of how to setup SSL certificate to secure Azure Web App with HTTPS. It is based on “[Let’s Encrypt](https://letsencrypt.org/)” and “[letsencrypt-webapp-renewer](https://github.com/ohadschn/letsencrypt-webapp-renewer)”. “Let’s Encrypt” is a free certificate solution, and “letsencrypt-webapp-renewer” is a great automation tool for certificate installation. It is based on another tool “[letsencrypt-siteextension](https://github.com/sjkp/letsencrypt-siteextension)”. The differences are,

-   “letsencrypt-webapp-renewer” does not require an Azure Storage Account, but “letsencrypt-siteextension” does.
-   “letsencrypt-webapp-renewer” is a WebJob, and can run on a different Web App from the Web App to install certificate. And it can manage multiple Web Apps’ certificates as well. “letsencrypt-siteextension” is a Website extension, and can only run with the Web App which needs certificate.

So here “letsencrypt-webapp-renewer” is used.

## What is “Let’s Encrypt”

“[Let’s Encrypt](https://letsencrypt.org/)” is a popular certificate authority, it can issue SSL certificate for free, and currently providing certificates for more than 115 million websites. Since July 2018, the Let’s Encrypt root, ISRG Root X1, is directly trusted by Microsoft products. So currently its root is now trusted by all mainstream root programs, including Microsoft, Google, Apple, Mozilla, Oracle, and Blackberry.

[![Annotation 2019-02-09 155224](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20155224_thumb.jpg "Annotation 2019-02-09 155224")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20155224_2.jpg)

However, its free certificate expirees in every 3 months (90 days), not yearly. So a automation process will be setup to renew and install the certificates.

## Setup Active Directory and App Registration

In Azure portal, go to the Active Directory, add a new App Registration:

[![Annotation 2019-02-09 073404_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20073404_thumb_thumb.jpg "Annotation 2019-02-09 073404_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20073404_thumb_2.jpg)

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_thumb_8.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_20.png)

Save its application id, later it will be used as “client id”:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_thumb_9.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_22.png)

Then go to Certificates & secretes, add a client secrete, and save it:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_thumb_10.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_24.png)

## Setup Resource Group

Go to resource group, In Access Control, add the above App Registration as contributor:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_thumb_11.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_26.png)

## Setup Azure Web App (aka Azure App Service Website)

This article assumes an existing Azure Web App. If you do not have one yet, it is very straightforward to create one from the Azure portal. Then you can deploy your website to that Azure Web App.

[![Annotation 2019-02-09 020852_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20020852_thumb_thumb.jpg "Annotation 2019-02-09 020852_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20020852_thumb_2.jpg)

Save the subscription id and resource group name for later usage.

Only Basic (B1+) and above pricing tiers support SSL. The free tier (F1) and the cheapest Shared tier (D1) does not support SSL, and [Microsoft has declined to enable this feature for Shared (D1](https://feedback.azure.com/forums/169385-web-apps/suggestions/17531527-make-ssl-support-for-d1-shared-app-services)). If you have a F1 or D1 web app, go to “Scale up” in the Azure portal, change the pricing tier to B1 and above, which is more than 3 times of the Shared (D1) price.

[![Annotation 2019-02-09 072255_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20072255_thumb_thumb.jpg "Annotation 2019-02-09 072255_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20072255_thumb_2.jpg)

### Setup custom domain

Shared pricing tier and above support custom domain. Follow the guidelines in the portal to setup your domain.

[![Annotation 2019-02-09 064042_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20064042_thumb_thumb.jpg "Annotation 2019-02-09 064042_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20064042_thumb_2.jpg)

To verify your domain ownership, Let’s Encrypt requests your-domain.com/.well-known/acme-challenge/{longId}. For example: hanziyuan.net/.well-known/acme-challenge/mftvrU2brecAXB76BsLEqW\_SL\_srdG3oqTQTzR5KHeA.

### Enable HTTPS in ASP.NET Core website

In your ASP.NET Core website, you may want to enable HSTS, and redirect HTTP request to HTTPS:

public class Startup
{
    public void ConfigureServices(IServiceCollection services) // Container.
    {
        if (this.environment.IsProduction())
        {
            **services.AddHttpsRedirection(options => options.HttpsPort = 443);**
        }

        // Other configuration.
    }

    public void Configure(IApplicationBuilder application, ILoggerFactory loggerFactory, IAntiforgery antiforgery, Settings settings) // HTTP pipeline.
    {
        if (this.environment.IsProduction())
        {
            **application.UseHsts();**
            **application.UseHttpsRedirection();** 
        }

        // Other configuration.
    }
}

You also want to look up the hyperlinks and resources (images, etc.), and replace their URIs with HTTPS.

## Automation with letsencrypt-webapp-renewer

[letsencrypt-webapp-renewer](https://github.com/ohadschn/letsencrypt-webapp-renewer) is a console application. It works as a [WebJob of Azure Web App](https://docs.microsoft.com/en-us/azure/app-service/webjobs-create), and automatically install/renew Let’s Encrypt certificate for your Azure Web App.

### Create a separate Web App for automation

You can install SSL on one Azure Web App, and run letsencrypt-webapp-renewer as WebJob of the same Web App, or a different Web App. As the author Ohad Schneider pointed out in the comments, it is highly recommended to have the run letsencrypt-webapp-renewer as WebJob of a separate Web App, because:

-   You can use it to manage multiple Web Apps.
-   WebJob is just a console application, its files (\*.exe, \*.dll, etc.) are deployed to your Web App’s App\_Data directory (e.g. App\_Data/jobs/triggered/letsencrypt/). So a WebJob can be silently deleted when you deploy/publish your website.

In this tutorial, I run letsencrypt-webapp-renewer as WebJob of a separate Web App. This automation Web App is created under the same App Service plan. Since Azure charges per App service plan, I do not need to pay additional cost for this automation web App.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_10.png)

### Add application settings

Download the setup PowerShell script from [https://github.com/ohadschn/letsencrypt-webapp-renewer/blob/master/OhadSoft.AzureLetsEncrypt.Renewal/Scripts/Set-LetsEncryptConfiguration.ps1](https://github.com/ohadschn/letsencrypt-webapp-renewer/blob/master/OhadSoft.AzureLetsEncrypt.Renewal/Scripts/Set-LetsEncryptConfiguration.ps1), and run:

> PS D:\\User\\Desktop> **.\\Set-LetsEncryptConfiguration.ps1 -LetsEncryptSubscriptionId e09d69aa-afa1-4db3-aea3-ca58cc2d82ee -LetsEncryptResourceGroup etymology -LetsEncryptWebApp etymology-letsencrypt -SubscriptionId e09d69aa-afa1-4db3-aea3-ca58cc2d82ee -ResourceGroup etymology -WebApp etymology -ServicePlanResourceGroup etymology -TenantId dixinyanlive.onmicrosoft.com -ClientId 9ca16da2-9252-4a55-8c99-b41d458d7fc4 –ClientSecret ‘\*\*\*\*’ -Hosts hanziyuan.net -Email dixinyan@live.com** Signing in to Azure Resource Manager account (use the account that contains your Let's Encrypt renewal web app)...
> 
> Account : dixinyan@live.com SubscriptionName : Visual Studio Enterprise SubscriptionId : e09d69aa-afa1-4db3-aea3-ca58cc2d82ee TenantId : 31a11410-e324-47a1-bbc4-9884031e3b14 Environment : AzureCloud
> 
> Setting context to the Let's Encrypt subscription ID...
> 
> Name : \[dixinyan@live.com, e09d69aa-afa1-4db3-aea3-ca58cc2d82ee\] Account : dixinyan@live.com Environment : AzureCloud Subscription : e09d69aa-afa1-4db3-aea3-ca58cc2d82ee Tenant : 31a11410-e324-47a1-bbc4-9884031e3b14 TokenCache : Microsoft.Azure.Commands.Common.Authentication.AuthenticationStoreTokenCache VersionProfile : ExtendedProperties : {}
> 
> Loading existing Let's Encrypt web app settings... Copying over existing app settings... Adding new settings... Setting 'subscriptionId' to 'e09d69aa-afa1-4db3-aea3-ca58cc2d82ee'... Setting 'resourceGroup' to 'etymology'... Setting 'servicePlanResourceGroup' to 'etymology'... Setting 'tenantId' to 'dixinyanlive.onmicrosoft.com'... Setting 'clientId' to 'letsencrypt'... Setting 'hosts' to 'hanziyuan.net'... Setting 'email' to 'dixinyan@live.com'... Value not provided for app setting 'useIpBasedSsl' - skipping... Value not provided for app setting 'rsaKeyLength' - skipping... Value not provided for app setting 'acmeBaseUri' - skipping... Setting 'renewXNumberOfDaysBeforeExpiration' to '-1'... Copying over existing connection strings... Adding new connection string... Updating settings...
> 
> SiteName : etymology-letsencrypt State : Running HostNames : {etymology-letsencrypt.azurewebsites.net} RepositorySiteName : etymology-letsencrypt UsageState : Normal Enabled : True EnabledHostNames : {etymology-letsencrypt.azurewebsites.net, etymology-letsencrypt.scm.azurewebsites.net} AvailabilityState : Normal HostNameSslStates : {etymology-letsencrypt.azurewebsites.net, etymology-letsencrypt.scm.azurewebsites.net} ServerFarmId : /subscriptions/e09d69aa-afa1-4db3-aea3-ca58cc2d82ee/resourceGroups/etymology/providers/Micr osoft.Web/serverfarms/etymology LastModifiedTimeUtc : 2/10/2019 10:43:42 PM SiteConfig : Microsoft.Azure.Management.WebSites.Models.SiteConfig TrafficManagerHostNames : PremiumAppDeployed : ScmSiteAlsoStopped : False TargetSwapSlot : HostingEnvironmentProfile : MicroService : GatewaySiteName : ClientAffinityEnabled : True ClientCertEnabled : False HostNamesDisabled : False OutboundIpAddresses : 207.46.144.46,207.46.144.85,207.46.144.91,207.46.148.246 ContainerSize : 0 MaxNumberOfWorkers : CloningInfo : ResourceGroup : etymology IsDefaultContainer : DefaultHostName : etymology-letsencrypt.azurewebsites.net Id : /subscriptions/e09d69aa-afa1-4db3-aea3-ca58cc2d82ee/resourceGroups/etymology/providers/Micr osoft.Web/sites/etymology-letsencrypt Name : etymology-letsencrypt Location : East Asia Type : Microsoft.Web/sites Tags :
> 
> Let's Encrypt settings updated successfully
> 
> PS D:\\User\\Desktop>

This adds a bunch of settings and a connection string to the automation Web App, which will be read by the WebJob:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_thumb_5.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_14.png)

### Setup and run WebJob

Download the latest release of letsencrypt-webapp-renewer, which is a zip file with everything packed. Upload it as a Triggered WebJob of the automation Web App:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_thumb_4.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_12.png)

As mentioned by the official document, “The [recommended Let's Encrypt renewal period is 60 days](https://letsencrypt.org/docs/faq/), so you could use a CRON expression that fires once every two months, for example: 0 0 0 1 1,3,5,7,9,11 \*.”

Now manually start the WebJob:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_thumb_7.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_18.png)

When it’s done, the SSL certificate is installed/renewed for the Azure Web App. And you are good to go with HTTPS: [https://hanziyuan.net](https://hanziyuan.net). You can also click the Logs button to view the details:

[![Annotation 2019-02-09 071735_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20071735_thumb_thumb.jpg "Annotation 2019-02-09 071735_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20071735_thumb_2.jpg)

This is useful for troubleshooting. For example, if your Web App is Shared (D1) pricing tier, it will fail with detailed info in the logs [https://etymology.scm.azurewebsites.net/vfs/data/jobs/triggered/letsencrypt/201902081828412089/output\_log.txt](https://etymology.scm.azurewebsites.net/vfs/data/jobs/triggered/letsencrypt/201902081828412089/output_log.txt):

> \[02/08/2019 18:29:11 > 021587: INFO\] AzureLetsEncryptRenewer.exe Error: 0 : Encountered exception: Microsoft.Rest.Azure.CloudException: Cannot enable SNI SSL for a hostname 'hanziyuan.net' because current site mode does not allow it. \[02/08/2019 18:29:11 > 021587: INFO\] at Microsoft.Azure.Management.WebSites.WebAppsOperations.<BeginCreateOrUpdateWithHttpMessagesAsync>d\_\_208.MoveNext() \[02/08/2019 18:29:11 > 021587: INFO\] --- End of stack trace from previous location where exception was thrown ---

Once the WebJob finishes running, your Web App is secured with SSL, and HTTP requests are redirected to HTTPS.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_4.png)

And this is your certificate issued by Let’s Encrypt:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/image_6.png)

## Setup notification with SendGrid

These steps are optional and just for WebJob notification. In Azure portal, create a free SendGrid account:

[![Annotation 2019-02-09 074622_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20074622_thumb_thumb.jpg "Annotation 2019-02-09 074622_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20074622_thumb_2.jpg)

Then go to its settings, copy the user name.

[![Annotation 2019-02-09 074843_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20074843_thumb_thumb.jpg "Annotation 2019-02-09 074843_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20074843_thumb_2.jpg)

Use the user name and password to log on SendGrid – [https://sendgrid.com](https://sendgrid.com), then go to Settings, create an API key:

[![Annotation 2019-02-09 075120_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20075120_thumb_thumb.jpg "Annotation 2019-02-09 075120_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20075120_thumb_2.jpg)

Then in Azure portal, add a connection string “letsencrypt:SendGridApiKey” to Web App, then you are good to go:

[![Annotation 2019-02-09 075707_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20075707_thumb_thumb.jpg "Annotation 2019-02-09 075707_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20075707_thumb_2.jpg)

## Setup notification with Zapier

These steps are optional and just for WebJob notification. In Azure portal, go to the Web App’s Properties, copy its deployment trigger URL. Then go to Zapier [https://zapier.com](https://zapier.com), use that URL to create a Azure Web Apps Trigger with new Triggered WebJob run:

[![Annotation 2019-02-09 080358_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20080358_thumb_thumb.jpg "Annotation 2019-02-09 080358_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20080358_thumb_2.jpg)

Then setup email action:

[![Annotation 2019-02-09 081318_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20081318_thumb_thumb.jpg "Annotation 2019-02-09 081318_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/962e9ee15b1a_8139/Annotation%202019-02-09%20081318_thumb_2.jpg)