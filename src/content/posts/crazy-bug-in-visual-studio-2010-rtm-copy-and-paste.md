---
title: "Crazy Bug in Visual Studio 2010 RTM: Copy And Paste"
published: 2010-04-18
description: "The copy / paste functionality is very buggy in  Beta and RC. In Beta sometimes this even cause Visual Studio crash. Now after using RT"
image: ""
tags: ["Testing", "Usability", "Visual Studio"]
category: "Testing"
draft: false
lang: ""
---

The copy / paste functionality is very buggy in [Visual Studio 2010](http://www.microsoft.com/visualstudio/en-us) Beta and RC. In Beta sometimes this even cause Visual Studio crash. Now after using RTM for a week, I found the bug remains, and greatly affect the experience. I searched the Internet and found this [comment from Microsoft](http://connect.microsoft.com/VisualStudio/feedback/details/533726/copy-paste-issue-in-vs-2010-rc):

> We unfortunately weren't able to address this in time for VS 2010 RTM, but we now understand the issue and are investigating it for a VS 2010 service pack and the next major release of Visual Studio. … It's too soon to know exactly when this will be fixed, but we agree that it's a serious issue, and we are working on addressing it.

Currently, when copy / paste do not work, the only solution is to close the file and reopen, and try to copy / paste again. But this does not always work. Sometimes I have to restart Visual Studio. Because I frequently copy code from Visual Studio and paste to [Windows Live Writer](http://en.wikipedia.org/wiki/Windows_Live_Writer) while blogging, this really drives me crazy!

Update:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_2EDD14E5.png "image")

Sometimes “Copy exception detail to the clipboard” does not work either.