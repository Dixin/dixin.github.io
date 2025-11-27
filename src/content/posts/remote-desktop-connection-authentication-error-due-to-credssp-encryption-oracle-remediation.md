---
title: "Remote desktop connection authentication error due to CredSSP encryption oracle remediation"
published: 2018-05-13
description: "Recently, when connecting to another Windows machine with RD, I got the following RDP authentication error due to CredSSP encryption oracle remediation:"
image: ""
tags: ["Windows", "Security"]
category: "Windows"
draft: false
lang: ""
---

Recently, when connecting to another Windows machine with RD, I got the following RDP authentication error due to CredSSP encryption oracle remediation:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/dbe535fb50d4_1579/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/dbe535fb50d4_1579/image_6.png)

> An authentication error has occurred. The function requested is not supported
> 
> Remote computer: <computer name> This could be due to CredSSP encryption oracle remediation. For more information, see https:/go.microsoft.com/fwlink/?linkid=866660

## Windows client

Following the above link, and searching around, this seems caused by the client Windows is patched with a CredSSP (Credential Security Support Provider protocol) update for [CVE-2018-0886](https://portal.msrc.microsoft.com/en-us/security-guidance/advisory/CVE-2018-0886), while the remote Windows is not. The solution is certainly patching the remote Windows. However, if you do not have the permission to patch the remote Windows (In this case, I am connecting to a build VM provided by AppVeyor), then you have to compromise the client.

### Windows Pro Edition (with group policy editor)

The workable solution I found is to edit client Windows’ local group policy (gpedit.msc):

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/dbe535fb50d4_1579/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/dbe535fb50d4_1579/image_2.png)

Under Computer Configuration -> Administrative Templates -> System -> Credentials Delegation, there is a setting “Encryption Oracle Remediation”. Its default value is “Not configured”. Just change it to “Enabled”, and set “Protection Level” as “Vulnerable”.

Windows 10:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/dbe535fb50d4_1579/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/dbe535fb50d4_1579/image_4.png)

Windows 7:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Remote-desktop-connection-authentication_1CE9/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Remote-desktop-connection-authentication_1CE9/image_2.png)

Now your remote desktop should be able to connect. Remember to revert the setting after you are done.

### Windows Home Edition client (without above option)

If your Windows client does not have group policy editor or above “Oracle Remediation” option (like Windows Home Edition), then you can temporarily uninstall the security update patch in May 2018, KB41037XX:

-   on Windows 10 17134.48, it is KB4103721 : [https://support.microsoft.com/en-au/help/4103721/windows-10-update-kb4103721](https://support.microsoft.com/en-au/help/4103721/windows-10-update-kb4103721 "https://support.microsoft.com/en-au/help/4103721/windows-10-update-kb4103721")
-   on Windows 10 16299.431, it is KB4103727: [https://support.microsoft.com/en-us/help/4103727/windows-10-update-kb4103727](https://support.microsoft.com/en-us/help/4103727/windows-10-update-kb4103727 "https://support.microsoft.com/en-us/help/4103727/windows-10-update-kb4103727")
-   On Windows 7 it is KB4103718: [https://support.microsoft.com/en-us/help/4103718/windows-7-update-kb4103718](https://support.microsoft.com/en-us/help/4103718/windows-7-update-kb4103718 "https://support.microsoft.com/en-us/help/4103718/windows-7-update-kb4103718")

etc.

Windows 10:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Remote-desktop-connection-authentication_1CE9/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Remote-desktop-connection-authentication_1CE9/image_6.png)

Windows 7:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Remote-desktop-connection-authentication_1CE9/image_thumb_3.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Remote-desktop-connection-authentication_1CE9/image_8.png)

Remember to reinstall it when you are done.

## Windows server

In the comment area, @Rome mentioned that, on server side, this can be mitigated by disabling “Allow connections only from computers running Remote Desktop with Network Level Authentication (recommended)” in server’s system properties.

Windows Server 2016:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Remote-desktop-connection-authentication_1CE9/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Remote-desktop-connection-authentication_1CE9/image_4.png)

I strongly suggest not to compromise the server-side security, but mitigate it from client Windows temporarily. You should patch the server-side or ask server administrator to patch it.