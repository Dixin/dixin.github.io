---
title: "A UI bug of Windows Server 2008 R2 RTM"
published: 2009-09-07
description: "Today when playing with Windows Server 2008 R2 RTM at home, I noticed a small UI bug from the start menu."
image: ""
tags: ["Testing", "Windows"]
category: "Testing"
draft: false
lang: ""
---

Today when playing with Windows Server 2008 R2 RTM at home, I noticed a small UI bug from the start menu.

After R2 RTM is installed, for the first log on, the default setting for “Control Panel” item of start menu is “Display as a menu”. Actually, the “Control Panel” item is displayed as a link.

![windows-server-2008-r2-rtm-ui-bug](https://aspblogs.z22.web.core.windows.net/dixin/Media/windowsserver2008r2rtmuibug_44C2527F.png "windows-server-2008-r2-rtm-ui-bug")

To resolve this, first select “Display as a link” in the “Customize Start Menu” dialog, click ”OK”, the “Control Panel” item remains. Then select “Display as a menu” back, this time “Control Panel” item is displayed as a menu, just like we expected.

This bug repros in my:

-   Windows Server 2008 R2 RTM Enterprise
-   Windows Server 2008 R2 RTM Datacenter
-   Windows Server 2008 R2 RTM Standard