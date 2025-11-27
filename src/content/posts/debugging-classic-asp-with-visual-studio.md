---
title: "Debugging Classic ASP with Modern Visual Studio"
published: 2016-05-23
description: "Recently I tried to show my Mom some websites I built when I was a kid. Those , some in  wh"
image: ""
tags: ["ASP", "Debug", "IIS", "Visual Studio"]
category: "ASP"
draft: false
lang: ""
---

Recently I tried to show my Mom some websites I built when I was a kid. Those [ASP code](http://en.wikipedia.org/wiki/Active_Server_Pages), some in [VBScript](http://en.wikipedia.org/wiki/VBScript) while some in [JavaScript](http://en.wikipedia.org/wiki/JavaScript), are more than 10 years old. They were running fine in [PWS](http://en.wikipedia.org/wiki/Microsoft_Personal_Web_Server), but now they didn’t run in [IIS 8.5](http://en.wikipedia.org/wiki/Internet_Information_Services). I have no idea what’s the problem. It seems a little debugging has to be done.

## Debugging with Visual Studio 2013/2015/2017 and IIS Express

I have [Windows 8.1](http://en.wikipedia.org/wiki/Windows_8.1) and [Visual Studio 2013](http://en.wikipedia.org/wiki/Microsoft_Visual_Studio#Visual_Studio_2013) (Later I have [Windows 10](https://en.wikipedia.org/wiki/Windows_10) and [Visual Studio 2015](https://en.wikipedia.org/wiki/Microsoft_Visual_Studio#Visual_Studio_2015)/[Visual Studio 2017](https://en.wikipedia.org/wiki/Microsoft_Visual_Studio#2017)). Surprisingly, I found that [IIS Express supports ASP](https://weblogs.asp.net/scottgu/introducing-iis-express):

> In addition to supporting ASP.NET, IIS Express also supports Classic ASP and other file-types and extensions supported by IIS – which also makes it ideal for sites that combine a variety of different technologies.

After searching and trying things around, using Visual Studio and [IIS Express](http://en.wikipedia.org/wiki/Internet_Information_Services#IIS_Express) seems to be the easiest way to run and debug ASP websites:

1.  Modify IIS Express configuration. Open %USERPROFILE%\\Documents\\IISExpress\\config\\applicationhost.config. Under [<system.webServer>](http://www.iis.net/configreference/system.webserver), find [<asp>](http://www.iis.net/configreference/system.webserver/asp):
    ```csharp
    <asp scriptErrorSentToBrowser="true">
        <cache diskTemplateCacheDirectory="%TEMP%\iisexpress\ASP Compiled Templates" />
        <limits />
    </asp>
    ```
    and change it to:
    ```csharp
    <asp scriptErrorSentToBrowser="true" enableParentPaths="true" bufferingOn="true" errorsToNTLog="true" appAllowDebugging="true" appAllowClientDebug="true">
        <cache diskTemplateCacheDirectory="%TEMP%\iisexpress\ASP Compiled Templates" />
        <session allowSessionState="true" />
        <limits />
    </asp>
    ```
    
2.  In Visual Studio, add existing website to the solution (or open a website), point to the ASP website folder.
3.  Start the website without debugging (Ctrl+F5).I will explain why.
4.  In Visual Studio, open the “Attach to Process” dialog (Ctrl+Alt+P). Notice the “Attach to” has the default option “Automatic: Native code” [![image_thumb9](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_thumb9_thumb.png "image_thumb9")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_thumb9_2.png)
5.  Click the “Select…” button, change it to “Script”: [![image_thumb10](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_thumb10_thumb.png "image_thumb10")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_thumb10_2.png)
6.  Now attach to IIS Express: [![image_thumb11](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_thumb11_thumb.png "image_thumb11")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_thumb11_2.png)
7.  If IIS Express is running multiple websites, there will be multiple iisexpress.exe processes in the “Available Processes”. The current website’s process ID can be found from the IIS Express site list: [![image_thumb13](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_thumb13_thumb.png "image_thumb13")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_thumb13_2.png)

Now the website can be debugged in Visual Studio:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_thumb_10.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_20.png)

And Solution Explorer shows the triggered .asp files, and how each .asp file includes other files.

[![image_thumb15](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_thumb15_thumb_1.png "image_thumb15")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_thumb15_5.png)

However, if the website is directly started with debugging (F5), Visual Studio will attach to native code or managed code. We have to start the website then manually attach to script code, as [MSDN mentions](http://msdn.microsoft.com/en-us/library/vstudio/ms241740\(v=vs.110\).aspx):

> When you debug script, Managed code must not be selected. You cannot debug script and managed code at the same time in Visual Studio 2005.

This is why in Step 4 we do not start website with debugging (F5).

As the second last picture shows, the index.asp has a \[dynamic\] tag. Visual Studio does not automatically map it to index.asp from the file system. This means, if a breakpoint is set in a \*.asp file, it won’t trigger when running the website. You may have to go back and forth between dynamic file and static file. To have the mapping automatically, IIS is needed.

## Debugging with Visual Studio 2013/2015 and IIS

Here are the steps:

1.  Open IIS manager, change ASP configurations to enable debugging: [![image_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_thumb_thumb.png "image_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_thumb_9.png)
2.  Run Visual Studio as administrator.
3.  Create an empty web application. In Visual Studio 2015, click File –> New –> Project…, then in the new project dialog, search “ASP.NET Web Application”. A WebApplication.csproj file and Web.config file will be created in the web application directory. [![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_4.png) [![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_2.png)
4.  Merge website folder to Visual Studio web application folder. In Visual Studio, include all website files into the created empty web application.
5.  In web application project’s properties, go to Web tab, choose “Local IIS”, create virtual directory in local IIS for this web application.
6.  In the “Attach to Process” dialog, attach Visual Studio to “Script Code” of IIS process (w3wp.exe). [![image_thumb1](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_thumb1_thumb.png "image_thumb1")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Debugging_13D39/image_thumb1_2.png)
7.  Manually start a browser, input the URI of the created virtual directory. Now the breakpoint set in the static .asp file triggers.

With this approach, the created WebApplication.csproj file and Web.config file pollute the website folder. Instead of web application, If creating/opening website in Visual Studio, it works the same as IIS Express. Web application has to be created so that Visual Studio can map to the static .asp files in file system during debugging.