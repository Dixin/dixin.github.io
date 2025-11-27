---
title: "C# 8.0 in-depth: Setup C# 8.0 and .NET Core 3.0"
published: 2019-02-21
description: "Currently, Microsoft has the second preview of C# 8.0 and .NET Core 3.0, with a lot of new features and new APIs. This part of C# 8.0 series demonstrates how to setup the environment."
image: ""
tags: ["C#", "C# 8.0", ".NET", ".NET Core", "Visual Studio Code"]
category: "C#"
draft: false
lang: ""
---

Currently, Microsoft has the second preview of C# 8.0 and .NET Core 3.0, with a lot of new features and new APIs. This part of C# 8.0 series demonstrates how to setup the environment.

One way to setup the environment is to install Visual Studio 2019 preview ([https://visualstudio.microsoft.com/vs/preview/](https://visualstudio.microsoft.com/vs/preview/ "https://visualstudio.microsoft.com/vs/preview/")). However, if you use Linux or macOS, or you do not have tons of space on your hard drive, you can go with Visual Studio Code. After all it is just a text editor.

## Setup .NET Core preview SDK

First, install the latest SDK of .NET Core 3.0 for your operating system from the official website: [https://dotnet.microsoft.com/download/dotnet-core/3.0](https://dotnet.microsoft.com/download/dotnet-core/3.0 "https://dotnet.microsoft.com/download/dotnet-core/3.0"). Currently v3.0.0-preview2/SDK 3.0.100-preview-010184 is the latest. Then run the following command to verify the installation:
```
dotnet --version
3.0.100-preview-010184
```

By default, the dotnet CLI uses the latest SDK installed for dotnet build and dotnet new, etc.. If you want to go back to the previous stable SDK, use the global.json to specify the stable SDK version for your directory. First, run dotnet –list-sdks to view all the installed SDKs, then run dotnet new globaljson –skd-version {version} to create the global.json file. Then run dotnet –version to verify the changed SDK version:
```
C:\Users\dixin>dotnet --list-sdks
2.1.202 [C:\Program Files\dotnet\sdk]
2.1.503 [C:\Program Files\dotnet\sdk]
2.2.100 [C:\Program Files\dotnet\sdk]
3.0.100-preview-010184 [C:\Program Files\dotnet\sdk]

C:\Users\dixin>d:

d:\>cd User\GitHub\CodeSnippets\Linq.Range\Test

d:\User\GitHub\CodeSnippets\Linq.Range\Test>dotnet new globaljson --sdk-version 2.2.100
The template "global.json file" was created successfully.

d:\User\GitHub\CodeSnippets\Linq.Range\Test>type global.json
{
  "sdk": {
    "version": "2.2.100"
  }
}
d:\User\GitHub\CodeSnippets\Linq.Range\Test>dotnet --version
2.2.100
```

## Setup Visual Studio Code with preview C# extension

Now Visual Studio Code should work with dotnet CLI, since it is just a text editor. The latest preview C# extension can be installed for a little better experience with C# 8.0. Go to its GitHub repo: [https://github.com/OmniSharp/omnisharp-vscode/releases](https://github.com/OmniSharp/omnisharp-vscode/releases "https://github.com/OmniSharp/omnisharp-vscode/releases"). Currently the latest preview is v1.18.0-beta7. Download the .vsix installer, then load it to Visual Studio Code:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/C-8.0-in-depth-Setup-C-8.0-and-.NET-Co.0_A434/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/C-8.0-in-depth-Setup-C-8.0-and-.NET-Co.0_A434/image_2.png)

After that, the extensions version shows 1.18.0-beta7:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/C-8.0-in-depth-Setup-C-8.0-and-.NET-Co.0_A434/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/C-8.0-in-depth-Setup-C-8.0-and-.NET-Co.0_A434/image_4.png)

## Setup project

Now create a new console app project with dotnet CLI: dotnet new console. Then open the created .csproj file, enable C# 8.0 by adding <LangVersion>8.0</LangVersion>, and enable C# 8.0 nullable reference type check by adding <NullableContextOptions>enable</NullableContextOptions>. The .csproj file becomes:
```
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>netcoreapp3.0</TargetFramework>
    <LangVersion>8.0</LangVersion>
    <NullableContextOptions>enable</NullableContextOptions>
  </PropertyGroup>

</Project>
```

In preview 1, <NullableReferenceTypes>true</NullableReferenceTypes> was used. Now it is changed to <NullableContextOptions>. Then you can start coding C# 8.0 and .NET Core 3.0, and press F5 to start debugging with Visual Studio Code.

If you create a library project, the default target framework is TargetFramework is netstandard2.0. It must be changed to netcoreapp3.0. The entire .csproj becomes:
```
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>netcoreapp3.0</TargetFramework>
    <LangVersion>8.0</LangVersion>
    <NullableContextOptions>enable</NullableContextOptions>
  </PropertyGroup>

</Project>
```

The difference is no <OutputType>Exe</OutputType>.