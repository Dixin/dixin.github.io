---
title: "Recover Outlook 2010 from crash"
published: 2012-03-15
description: "Today my  crashed while I am writing an email. When I restart I got this error:"
image: ""
tags: ["Office", "Windows"]
category: "Office"
draft: false
lang: ""
---

Today my [Outlook 2010](http://office.microsoft.com/en-us/outlook/) crashed while I am writing an email. When I restart I got this error:

> ‘Microsoft Office Outlook’ exited without properly closing your Outlook data file ‘c:\\Users\\dixinyan\\AppData\\Local\\Microsoft\\Outlook\\dixinyan@microsoft.com.ost’. ‘Microsoft Office Outlook’ must be restarted. If this error message recurs, contact support for ‘Microsoft Office Outlook’ for assistance.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_thumb_01FF61B7.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_2DDFDB73.png)

After clicking OK:

> Cannot start Microsoft Outlook. Cannot open the Outlook window. The set of folder cannot be opened.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_thumb_5395B63C.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_095B2164.png)

So that I cannot start my Outlook. I checked the Task Manager and found the outlook.exe is not there. So I have to go to [Process Explorer](http://technet.microsoft.com/en-us/sysinternals/bb896653), a tool of [Sysinternals](http://technet.microsoft.com/en-us/sysinternals/bb842062):

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_thumb_0F259F30.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_2246CBDC.png)

After terminating UcMapi64.exe, Outlook was back. So the conclusion is: it looks Microsoft [Lync 2010](http://lync.microsoft.com/en-us/Pages/unified-communications.aspx) killed Microsoft [Outlook 2010](http://office.microsoft.com/en-us/outlook/)!