---
title: "Run Hyper-V and VMware virtual machines on Windows 10"
published: 2019-01-14
description: "I use Windows’ Hyper-V to run virtual machines for long time. Recently I need to run a VMware virtual machine to test something. I installed VMware Player, which is free for non-commercial usage. Howe"
image: ""
tags: ["Hyper-v", "Virtual Machine", "VMware", "Windows", "Windows 10"]
category: "Windows"
draft: false
lang: ""
---

I use Windows’ Hyper-V to run virtual machines for long time. Recently I need to run a VMware virtual machine to test something. I installed VMware Player, which is free for non-commercial usage. However, the virtual machine cannot started, with an error:

> VMware Player and Device/Credential Guard are not compatible. VMware Player can be run after disabling Device/Credential Guard. Please visit [http://www.wmware.com/go/turnoff\_CG\_DG](http://www.wmware.com/go/turnoff_CG_DG) for more details.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/fe3eba9eac73_13F83/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/fe3eba9eac73_13F83/image_6.png)

The link will redirect you to a document with many steps.

> 1.  Disable the group policy setting that was used to enable Credential Guard.
>     
>     1.  On the host operating system, click S**tart** \> **Run**, type gpedit.msc, and click **Ok.** The Local group Policy Editor opens.
>     2.  Go to **Local Computer Policy** > **Computer Configuration** > **Administrative Templates > System** > **Device Guard** > **Turn on Virtualization Based Security**.
>     3.  Select **Disabled**.
> 2.  Go to **Control Panel** > **Uninstall a Program** \> **Turn Windows features on or off to turn off Hyper-V**.
> 3.  Select **Do not restart**.
> 4.  Delete the related EFI variables by launching a command prompt on the host machine using an Administrator account and run these commands: mountvol X: /s copy %WINDIR%\\System32\\SecConfig.efi X:\\EFI\\Microsoft\\Boot\\SecConfig.efi /Y bcdedit /create {0cb3b571-2f2e-4343-a879-d86a476d7215} /d "DebugTool" /application osloader bcdedit /set {0cb3b571-2f2e-4343-a879-d86a476d7215} path "\\EFI\\Microsoft\\Boot\\SecConfig.efi" bcdedit /set {bootmgr} bootsequence {0cb3b571-2f2e-4343-a879-d86a476d7215} bcdedit /set {0cb3b571-2f2e-4343-a879-d86a476d7215} loadoptions DISABLE-LSA-ISO,DISABLE-VBS bcdedit /set {0cb3b571-2f2e-4343-a879-d86a476d7215} device partition=X: mountvol X: /d **Note**: Ensure X is an unused drive, else change to another drive.
> 5.  Restart the host.
> 6.  Accept the prompt on the boot screen to disable Device Guard or Credential Guard.

Actually, this is a conflict that can be simply resolved by temporarily disabling Hyper-V hypervisor:

bcdedit /set hypervisorlaunchtype off

Restart is required. Apparently, the side effect is that Hyper-V virtual machines cannot be started after this:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/fe3eba9eac73_13F83/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/fe3eba9eac73_13F83/image_2.png)

And so is Docker:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/fe3eba9eac73_13F83/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/fe3eba9eac73_13F83/image_4.png)

To get Hyper-V back, just turn its hypervisor back on:

bcdedit /set hypervisorlaunchtype auto