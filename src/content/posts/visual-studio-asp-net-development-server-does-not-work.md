---
title: "Visual Studio ASP.NET Development Server Does Not Work"
published: 2009-03-21
description: "Recently the ASP.NET development server on my machine could not work. When F5 is pressed in Visual Studio 2008, IE started and displayed “Internet Explorer cannot display the webpage”. This problem na"
image: ""
tags: ["ASP.NET", "Visual Studio", "Web"]
category: "Visual Studio"
draft: false
lang: ""
---

Recently the ASP.NET development server on my machine could not work. When F5 is pressed in Visual Studio 2008, IE started and displayed “Internet Explorer cannot display the webpage”. This problem nagged me for a couple of days. I checked a lot of things, including logs, firewall, anti-virus software, project settings, the webdev.webserver.exe process, etc. They did not work. Finally I find my hosts file was somehow modified:

![hosts](https://aspblogs.z22.web.core.windows.net/dixin/Media/hosts_70E2D9BD.gif "hosts")

Once localhost is restored to 127.0.0.1, Visual Studio works.