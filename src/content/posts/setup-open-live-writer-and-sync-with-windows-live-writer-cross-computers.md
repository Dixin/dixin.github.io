---
title: "Setup Open Live Writer and sync with Windows Live Writer cross computers"
published: 2019-07-22
description: "Today I am setting up a new PC. I use Windows Live Writer to write for this blog for years, and found the new installation can no longer work for my blog. I tried Open Live Writer. Fortunately Open Li"
image: ""
tags: ["Windows Live", "Windows Live Writer"]
category: "Windows Live"
draft: false
lang: ""
---

Today I am setting up a new PC. I use Windows Live Writer to write for this blog for years, and found the new installation can no longer work for my blog. I tried Open Live Writer. Fortunately Open Live Writer works.

The next step is to synchronize the new Open Live Writer installation with my other computer’s Windows Live Writer.

## Plugins

The plugins for Windows Live Writer does not work for Open Live Writer. Take the the VSPaste plugin as example, it can paste code copied from Visual Studio into Windows Live Writer and keep the style and color. It is built for Windows Live Writer and does not work for Open Live Writer.

To rebuild it for Open Live Writer, first decompile the plugin dll file. Then replace the reference assembly WindowsLive.Writer.Api.dll with OpenLiveWriter.Api.dll, which can be found at %UserProfile%\\AppData\\Local\\OpenLiveWriter\\app-0.6.2.

The rebuilt plugin VSPaste.OpenLiveWriter.dll should be placed in the %UserProfile%\\AppData\\Local\\OpenLiveWriter\\app-0.6.2\\Plugins directory.

To debug the rebuilt plugin, clone the source of Open Live Writer from [https://github.com/OpenLiveWriter/OpenLiveWriter.git](https://github.com/OpenLiveWriter/OpenLiveWriter.git "https://github.com/OpenLiveWriter/OpenLiveWriter.git") and open in Visual Studio. Then launch Open Live Writer, and use Visual Studio to attach to the Open Live Writer process.

I have uploaded the plugin source to GitHub for demonstration purpose: [https://github.com/Dixin/LiveWriter.VSPaste](https://github.com/Dixin/LiveWriter.VSPaste).

To synchronize the plugin cross multiple PCs, I put the plugins (VSPaste.WindowsLiveWriter.dll and VSPaste.OpenLiveWriter.dll) into a OneDrive directory, for example, D:\\OneDrive\\LiveWriter\\Plugins. Then create a junction point for Windows Live Writer and Open Live Writer:

mklink /J C:\\Users\\dixin\\AppData\\Local\\OpenLiveWriter\\app-0.6.2\\Plugins D:\\OneDrive\\LiveWriter\\Plugins

## Synchronize blog id

As mentioned in [an earlier post](/posts/sync-windows-live-writer-drafts-and-posts-across-pcs), the blog account is associated with a GUID, and the GUID is written to blog post file (which is not a good design). For Windows Live Writer, the blog id is located under HKEY\_CURRENT\_USER\\SOFTWARE\\Microsoft\\Windows Live\\Writer\\Weblog\\. For Open Live Writer, it is located under Computer\\HKEY\_CURRENT\_USER\\Software\\OpenLiveWriter\\Weblogs. For the same blog, just make sure the same blog account has the same GUID.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Open-Live-Writer_1701/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Open-Live-Writer_1701/image_2.png)

C:\\Users\\dixinyan\\AppData\\Roaming\\Windows Live Writer\\blogtemplates

## Synchronize configurations

The configurations for Windows Live Writer is located under %UserProfile%\\AppData\\Roaming\\Windows Live Writer, and the configuratiuons for Open Live Writer is located under %UserProfile%\\AppData\\Roaming\\OpenLiveWriter. The configurations includes blog template, user dictionary for spell check, etc. These can also be synchronized cross multiple PCs using OneDrive:

mklink /J C:\\Users\\dixin\\AppData\\Roaming\\OpenLiveWriter D:\\OneDrive\\LiveWriter\\Configurations

## Synchronize blog posts

Once blog id is synchronized, it is safe to synchronize blog posts cross multiple PCs, again, using OneDrive:

mklink /J “C:\\Users\\dixin\\Documents\\My Weblog Posts” “D:\\OneDrive\\LiveWriter\\My Weblog Posts”