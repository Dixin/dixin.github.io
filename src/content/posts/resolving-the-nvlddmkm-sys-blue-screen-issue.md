---
title: "Resolving The nvlddmkm.sys Blue Screen Issue"
published: 2010-01-30
description: "I started to use ATI discrete graphic cards since 2002. At the end of 2009, I got my first pair of NVIDIA cards,  ,"
image: ""
tags: ["Hardware", "Windows"]
category: "Windows"
draft: false
lang: ""
---

I started to use ATI discrete graphic cards since 2002. At the end of 2009, I got my first pair of NVIDIA cards, [GTX260M SLI](http://www.notebookcheck.net/NVIDIA-GeForce-GTX-260M-SLI.18909.0.html) , and recently I after I upgraded the driver to [the latest 195 release](http://www.nvidia.com/object/notebook_winvista_win7_x64_195.62_whql.html), I encountered the blue screen failure on my laptop with Windows 7.

According to the blue screen, it is caused by nvlddmkm.sys. This is a file installed by the driver. By search the Windows directory, there are four nvlddmkm.sys files installed. And these two files has different signing time:

-   C:\\Windows\\System32\\DriverStore\\FileRepository\\nv\_lh.inf\_amd64\_neutral\_bc69f20e3115af59\\nvlddmkm.sys
-   C:\\Windows\\winsxs\\amd64\_nv\_lh.inf\_31bf3856ad364e35\_6.1.7600.16385\_none\_4a5c7d78e486512b\\nvlddmkm.sys

![nvlddmkm.sys](https://aspblogs.z22.web.core.windows.net/dixin/Media/nvlddmkm.sys_1196FDC4.gif "nvlddmkm.sys")

The other two files has newer signing time:

![nvlddmkm.sys-newer](https://aspblogs.z22.web.core.windows.net/dixin/Media/nvlddmkm.sysnewer_2011F9E9.gif "nvlddmkm.sys-newer")

So I guess this is the reason of the blue screen: the driver installer has abug that, when upgrading the driver, the installer doesn’t upgrade all nvlddmkm.sys files. And the solution is just replace the two old files. Up to now, the blue screen never appear again.