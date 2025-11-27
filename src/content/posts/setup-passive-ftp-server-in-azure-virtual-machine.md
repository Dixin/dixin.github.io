---
title: "Setup passive FTP server in Azure virtual machine"
published: 2019-01-29
description: "This article demonstrates how to setup a passive FTP server in a Azure virtual machine running Windows."
image: ""
tags: ["Blog"]
category: ""
draft: false
lang: ""
---

This article demonstrates how to setup a passive FTP server in a Azure virtual machine running Windows.

## Create virtual machine on Azure

Use Azure account to log on to the Azure portal: [https://portal.azure.com](https://portal.azure.com). A free Azure account and be created from [https://azure.microsoft.com/en-us/free/](https://azure.microsoft.com/en-us/free/ "https://azure.microsoft.com/en-us/free/").

In the Azure portal, click ”Create a resource” to create a “Windows Server 2016 VM”:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup_19D9/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup_19D9/image_2.png)

Follow the “Create virtual machine”wizard to specify the information, including location, size, auto-shutdown, etc. Review the price, if it is ok, click “Create”.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup_19D9/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup_19D9/image_4.png)

When it is done, a bunch of resources will be created, including:

-   a virtual machine and a diagnostics extension
-   a storage account and a disk,
-   a network interface, a network security group, a public IP address, and a virtual network

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup_19D9/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup_19D9/image_6.png)

## Setup FTP server in virtual machine

Go to the virtual machine’s blade, click “Connect” to log on to the virtual machine through remote desktop. Then install a FTP server, like IIS, or FileZilla Server from [https://filezilla-project.org/download.php?type=server](https://filezilla-project.org/download.php?type=server "https://filezilla-project.org/download.php?type=server").

To make passive mode work, the external IP address should be specified for the FTP server. In Azure portal, the external IP address can be copied from the virtual machine’s blade, or the public IP address’ blade. Also manually specify the port range for passive mode:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup_19D9/image_thumb_4.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup_19D9/image_10.png)

## Setup firewall and virtual network

In Windows, go to “Windows firewall with advanced security” console, create a inbound rule to allow TCP on port 21, and a inbound rule to allow the above port range:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup_19D9/image_thumb_5.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup_19D9/image_12.png)

Then go to portal, open the network security group’s blade, add the same inbound rukes:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup_19D9/image_thumb_6.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup_19D9/image_14.png)

If a custom domain should be used for this FTP server, add a A record to the domain, with the victual machine’s external IP address.

## Verify with a FTP client

Now use a FTP client, like FileZilla client, to connect with the external IP address or custom domain:

> Status: Resolving address of dixineastasia.eastasia.cloudapp.azure.com Status: Connecting to 52.175.15.132:21... Status: Connection established, waiting for welcome message... Status: Insecure server, it does not support FTP over TLS. Status: Logged in Status: Retrieving directory listing... Status: Directory listing of "/" successful Status: Resolving address of dixineastasia.eastasia.cloudapp.azure.com Status: Connecting to 52.175.15.132:21... Status: Connection established, waiting for welcome message... Status: Insecure server, it does not support FTP over TLS. Status: Logged in Status: Retrieving directory listing... Status: Directory listing of "/" successful Status: Connection closed by server