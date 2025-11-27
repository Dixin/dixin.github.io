---
title: "Easy Ways to Test SQL Server/SQL Azure Connection"
published: 2016-01-11
description: "It is incredibly easy to test the SQL Server/Azure SQL Database connectivity or firewall settings from Windows, even without SSMS ([SQL Server Management Studio](https://en.wikipedia.org/wiki/SQL_Serv"
image: ""
tags: ["SQL Server", "SQL Azure", "Azure SQL Database"]
category: "SQL Server"
draft: false
lang: ""
---

It is incredibly easy to test the SQL Server/Azure SQL Database connectivity or firewall settings from Windows, even without SSMS ([SQL Server Management Studio](https://en.wikipedia.org/wiki/SQL_Server_Management_Studio)) or coding.

## Test with ODBC Data Source

In Windows, press the Win key, type “data source”, press enter to open the [ODBC Data Sources](https://en.wikipedia.org/wiki/Open_Database_Connectivity):

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_thumb_4.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_10.png)

Click “Add” to add a data source:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_thumb_5.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_12.png)

Select SQL Server:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_thumb_8.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_18.png)

Fill in the server name of SQL Server/SQL Azure server name:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_thumb_9.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_20.png)

and credentials:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_thumb_11.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_24.png)

Click all the way to finish, the following dialog pops up:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_thumb_12.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_26.png)

Now click “Test Data Source” to test it:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_thumb_14.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_30.png)

> Microsoft SQL Server ODBC Driver Version 10.00.10586
> 
> Running connectivity tests...
> 
> Attempting connection Connection established Verifying option settings Disconnecting from server
> 
> TESTS COMPLETED SUCCESSFULLY!

## Test with UDL (Universal data link)

It can be even easier to test with [UDL (Universal data link)](https://en.wikipedia.org/wiki/Microsoft_Data_Access_Components#Universal_data_link). In Windows, create an arbitrary file:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_thumb_17.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_36.png)

Rename its extension name to .udl:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_thumb_18.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_38.png)

Double click it, and fill in the connection info:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_thumb_19.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_40.png)

Click “Test Connection”, it is done:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_thumb_20.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3587b12d222c_11751/image_42.png)