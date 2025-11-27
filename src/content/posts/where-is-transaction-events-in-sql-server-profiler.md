---
title: "Where Is Transaction Events In SQL Server Profiler?"
published: 2010-04-21
description: "does not monitor transaction events by default."
image: ""
tags: ["Database", "Profiling", "SQL Server", "TSQL"]
category: "Database"
draft: false
lang: ""
---

[SQL Server Profiler](http://msdn.microsoft.com/en-us/library/ms181091.aspx) does not monitor transaction events by default.

After installing SQL Server, when creating a new trace, the default template is “Standard”:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_0338E252.png "image")

Transaction events will not show in the trace because “Transactions” is not included in the “Standard” template:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_36847FE1.png "image")

“Transactions” is hidden by default. To show it up, check “Show all events”.

So the solution of monitoring transaction is, create a new template, and check the transaction events excepted to monitor. Then the profiler rocks!

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_6E5AC7BA.png "image")