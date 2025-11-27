---
title: "End-to-end: Setup continuous integration/continuous delivery for ASP.NET Core + SQL database with GitHub, AppVeyor and Azure"
published: 2016-01-14
description: "I have a web project “Chinese Etymology ()” for searching Chinese character’s etymologies and ancient Chinese characters. It is developed with Microsoft tec"
image: ""
tags: ["ASP.NET Core", ".NET Core", "Node.js", "GitHub", "Azure SQL Database", "Azure", "SQL Server", "CI", "CD", "Continuous Integration", "Continuous Delivery", "DevOps", "AppVeyor", "Debug", "Deployment", "YAML", "YML"]
category: "ASP.NET Core"
draft: false
lang: ""
---

I have a web project “Chinese Etymology ([http://hanziyuan.net](http://hanziyuan.net))” for searching Chinese character’s etymologies and ancient Chinese characters. It is developed with Microsoft tech stack – ASP.NET Core + SQL database. It is open source on GitHub. Its database is deployed to Azure SQL Database, and the website is deployed to Azure App Service. I will use this project to demonstrate the end-to-end workflow and setup for continuous integration/continuous delivery with AppVeyor. After these steps, when you commit code and push to your repository

-   your code will be built automatically.
-   tests will run automatically, connecting a staging SQL database with secured connection string info.
-   your release build will be deployed to a staging environment on Azure automatically.

## AppVeyor

AppVeyor is a CI solution for Windows. It is free for open source projects. I used it quite a while for traditional .NET + SQL Server projects. It is extremely friendly to Microsoft technologies.

To use AppVeyor with code in GitHub, just go to [https://appveyor.com](https://appveyor.com), log in with GitHub account. it also supports BitBucket and VSTS (Visual Studio Team Services). Then follow the UI to connect your GitHub repository. Then you need to place a appveyor.yml configuration file at the root of your repository. You can follow the [appveyor.yml reference](https://www.appveyor.com/docs/appveyor-yml/) and create the file manually, and validate it with [a validator provided by AppVeyor](https://ci.appveyor.com/tools/validate-yaml). Or, you can go to your AppVeyor project, click “Settings”, follow te nice UI to fill in the customization, and then export a appveyor.yml file.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_2.png)

AppVeyor has a [Build Configuration](https://www.appveyor.com/docs/build-configuration/) document, showing its entire pipeline.

> 1.  Run `init` scripts
> 2.  **Clone** repository into clone folder
>     -   Checkout build commit
>     -   `cd` to clone folder
> 3.  Restore build cache
> 4.  Run `install` scripts
> 5.  Patch `AssemblyInfo` and `.csproj` files
> 6.  Modify `hosts` files
> 7.  Start services
> 8.  **Build**
>     -   Run `before_build` scripts
>     -   Run msbuild
>     -   Run `after_build` scripts
> 9.  **Test**
>     -   Run `before_test` scripts
>     -   Discover and run tests
>     -   Run `after_test` scripts
> 10.  Call `build_success` webhooks
> 11.  **Package** artifacts
> 12.  **Deployment**
>      -   Run `before_deploy` scripts
>      -   Run all configured deployments
>      -   Run `after_deploy` scripts
> 13.  **Finalize** successful builds:
>      -   Call `deployment_success` webhooks
>      -   Run `on_success` scripts
>      -   Save build cache
> 14.  **Finalize** failed builds:
>      -   Call `build_failure` webhooks
>      -   Optionally save build cache
>      -   Call `deployment_failure` webhooks
>      -   Run `on_failure` scripts
> 15.  **Finalize** both successful and failed builds:
>      -   Call `on_finish` scripts

## Initialize environment

My project is built with ASP.NET Core 2.0, so I used the build worker image “Visual Studio 2017”, and turned on .NET Core patching:
```
dotnet_csproj:
  patch: true
  file: '**\*.csproj'
  version: '{version}'
  package_version: '{version}'
  assembly_version: '{version}'
  file_version: '{version}'
  informational_version: '{version}'
```

I also used WebPack for the website UI, so I need install Node.js and NPM:
```
install:
- ps: >-
    Install-Product node 8
```

By default, AppVeyor runs msbuild to build the solution. So before build, dotnet restore is needed to install all the NuGet packages. npm install is also needed to install all the NPM packages.
```
before_build:
- cmd: >-
    dotnet restore
cd ./src/Etymology.Web

    npm install

    cd ../..
```

Now it is good to build.

## Run tests

I am using MSTest framework. After build, the tests will be automatically discovered:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_thumb_7.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_16.png)

### Connect to Azure SQL database with secure variables

My tests needs to connect to Azure SQL database to run. In this case, we can hide the secretes in connection string with secure variables. The following is the settings file containing the connection string:
```
{
  "ConnectionStrings": {
    "Etymology": "Server=tcp:{server}.database.windows.net,1433;Initial Catalog={database};Persist Security Info=False;User ID={user};Password={password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  }
}
```

This file is committed to repository and exposed to public. Now encrypt the real values in AppVeyor with [its encryption tool](https://ci.appveyor.com/tools/encrypt) or UI:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_thumb_8.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_18.png)

Now these encrypted secretes can go to appveyor.yml and expose to public, along with other [environment variables](https://www.appveyor.com/docs/environment-variables/):
```
environment:
  Server:
    secure: TvXoVEeYYNoo2cXBZTeGuQ==
  Database:
    secure: VoBmaLf7l0+NV1kGgG+wPg==
  User:
    secure: UzHGGTiu63CYQPT9rPKhJA==
  Password:
    secure: si1rZXqiINGCaeQU0Oh7hg==
  APPVEYOR_RDP_PASSWORD:
    secure: aii6TuA5V1pzlqRiUOXyTQ==
  ASPNETCORE_ENVIRONMENT: Staging
```

In AppVeyor, these secure variables can be access just like othernormal environment variables. So before build, just replace the connection string with decrypted values:
```
install:
- ps: >-
    Install-Product node 8
$file = "$($env:appveyor_build_folder)\src\Etymology.Web\Server\settings.$($env:ASPNETCORE_ENVIRONMENT).json"

    (Get-Content $file).Replace("{server}", $env:Server).Replace("{database}", $env:Database).Replace("{user}", $env:User).Replace("{password}", $env:Password) | Set-Content $file
```

Now the settings file has the real connection string info.

On the Azure side, go to the SQL database’s server, in the firewall settings, whitelist [all AppVeyor build worker IP addresses](https://www.appveyor.com/docs/build-environment/#ip-addresses):

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_thumb_11.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_24.png)

### Connect to on-premise SQL Server database

What if on-premise SQL Server is used? I have an .NET Framework project using .mdf and ldf files with SQL Server LocalDB. In AppVeyor, I just enable SQL Server, attach the .mdf and ldf files, and update the connection string:
```
services: mssql2016
before_test:
- ps: >-
    $server = "(local)\SQL2016"

    $database = "AdventureWorks"
# Replace the db connection with the local instance.

    $configPath = "$($env:appveyor_build_folder)\EntityFramework.Functions.Tests\bin\$($env:CONFIGURATION)\EntityFramework.Functions.Tests.dll.config"

    $config = (gc $configPath) -as [xml]

    $config.SelectSingleNode('//connectionStrings/add[@name="EntityFramework.Functions.Tests.Properties.Settings.AdventureWorksConnectionString"]').connectionString = "Server=$server; Database=$database; Trusted_connection=true"

    $config.Save($configPath)
# Attach mdf to local instance.

    $databaseDirectory = "$($env:appveyor_build_folder)\Data"

    $mdfPath = join-path $databaseDirectory "AdventureWorks_Data.mdf"

    $ldfPath = join-path $databaseDirectory "AdventureWorks_Log.ldf"

    sqlcmd -S "$server" -Q "Use [master]; CREATE DATABASE [$database] ON (FILENAME = '$mdfPath'),(FILENAME = '$ldfPath') FOR ATTACH"

    sqlcmd -S "$server" -Q "Use [$database]; EXEC sys.sp_configure @configname = N'clr enabled', @configvalue = 1;"

    sqlcmd -S "$server" -Q "Use [$database]; RECONFIGURE;"
```

## Deploy to Azure

First got to Azure, create a App Service on Azure. If you do not have an Azure account/subscription, you can go to Dev Essentials and get a free one. Here I created a App Service of free pricing tier from [https://portal.azure.com](https://portal.azure.com). Since my code detects the environment, I also used the portal to add environment variable “ASPNETCORE\_ENVIRONMENT”, and set it to “Staging”.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_4.png)

Also create a user name/password for deployment:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_6.png)

Now go to AppVeyor.By default, AppVeyor calls msbuild to build the solution, which is good for .NET Core projects. For my ASP.NET Core projects, I run the “dotnet publish” after running tests to export all binaries and resources (HTML, CSS, JavaScript, images, settings) to a Publish/{BuildConfiguration} directory.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_thumb_4.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_10.png)

Since only the release build needs to be deployed, create an artifact “PublishRelease”, which can be viewed as an alias pointing to the Publish/Release directory.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_thumb_6.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_14.png)

Then enable packaging for xcopy deployment:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_thumb_5.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_12.png)

And specify the Azure deployment credential user name and password created just now, as well as the above artifact to deploy:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_thumb_3.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_8.png)

The YAML will be like this:
```
build:
  publish_wap_xcopy: true
  parallel: true
  verbosity: detailed
after_test:
- ps: dotnet publish ./src/Etymology.Web/Etymology.Web.csproj -c $env:CONFIGURATION -o ../../Publish/$env:CONFIGURATION
artifacts:
- path: ./Publish/Release
  name: PublishRelease
deploy:
- provider: AzureAppServiceZipDeploy
  appservice_environment: false
  website: etymologystaging
  username: dixinyan
  password:
    secure: aii6TuA5V1pzlqRiUOXyTQ==
  artifact: PublishRelease
```

The Debug build will not be deployed:

> \[00:11:22\] Collecting artifacts... \[00:11:23\] No artifacts found matching 'Publish\\Release' path \[00:11:23\] Deploying using AzureAppServiceZipDeploy provider \[00:11:23\] No Zip artifacts were found. Only Zip artifacts can be published as Azure App Service Zip Push Deploy. Make sure you have specified correct artifacts filter. \[00:11:23\] If you are using AppVeyor Web Application packaging, please ensure that you selected 'Package Web Applications for XCopy deployment' ('publish\_wap\_xcopy: true' in YAML). \[00:11:23\] Build success

And the Release build will be deployed:

> \[00:10:36\] Collecting artifacts... \[00:10:36\] Found artifact 'Publish\\Release' matching 'Publish\\Release' path \[00:10:36\] Uploading artifacts... \[00:10:36\] \[00:10:40\] \[1/1\] PublishRelease...Zipping to PublishRelease.zip \[00:10:40\] \[1/1\] Publish\\PublishRelease.zip (19,221,277 bytes)...1% \[00:10:40\] \[1/1\] Publish\\PublishRelease.zip (19,221,277 bytes)...10% \[00:10:41\] \[1/1\] Publish\\PublishRelease.zip (19,221,277 bytes)...20% \[00:10:41\] \[1/1\] Publish\\PublishRelease.zip (19,221,277 bytes)...30% \[00:10:41\] \[1/1\] Publish\\PublishRelease.zip (19,221,277 bytes)...40% \[00:10:41\] \[1/1\] Publish\\PublishRelease.zip (19,221,277 bytes)...50% \[00:10:41\] \[1/1\] Publish\\PublishRelease.zip (19,221,277 bytes)...60% \[00:10:41\] \[1/1\] Publish\\PublishRelease.zip (19,221,277 bytes)...70% \[00:10:41\] \[1/1\] Publish\\PublishRelease.zip (19,221,277 bytes)...80% \[00:10:41\] \[1/1\] Publish\\PublishRelease.zip (19,221,277 bytes)...90% \[00:10:41\] \[1/1\] Publish\\PublishRelease.zip (19,221,277 bytes)...100% \[00:10:41\] Deploying using AzureAppServiceZipDeploy provider \[00:10:58\] Deploying "PublishRelease.zip" to "\*\*\*\*\*staging" site...OK \[00:10:59\] Build success

## Remote desktop debugging

AppVeyor also supports debugging with remote desktop. To enable this, add a secure variable “APPVEYOR\_RDP\_PASSWORD”, which will be your remote desktop password. Then add the following command:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_thumb_9.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Continuous-Integration-with-GitHub-AppVe_2A0D/image_20.png)

It will print the connection info at the very beginning of the build console:

> \[00:00:00\] Build started \[00:00:00\] iex ((new-object net.webclient).DownloadString('[https://raw.githubusercontent.com/appveyor/ci/master/scripts/enable-rdp.ps1'))](https://raw.githubusercontent.com/appveyor/ci/master/scripts/enable-rdp.ps1'\)\)) \[00:00:03\] Remote Desktop connection details: \[00:00:03\] Server: 67.225.139.254:33923 \[00:00:03\] Username: appveyor

You may get an authentication error due to CredSSP encryption oracle remediation:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/dbe535fb50d4_1579/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/dbe535fb50d4_1579/image_6.png)

If so, please follow [another post of mine](/posts/remote-desktop-connection-authentication-error-due-to-credssp-encryption-oracle-remediation).

The full appveyor.yml can be viewed on GitHub: [https://github.com/Dixin/Etymology/blob/master/appveyor.yml](https://github.com/Dixin/Etymology/blob/master/appveyor.yml "https://github.com/Dixin/Etymology/blob/master/appveyor.yml").