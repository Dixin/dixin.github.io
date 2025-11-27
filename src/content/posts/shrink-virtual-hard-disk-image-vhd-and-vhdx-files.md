---
title: "Shrink Virtual Hard Disk Image (VHD and VHDX) Files"
published: 2016-05-06
description: "Virtual hard disk image files () grow bigger during the usage. For instance, this is a 20G virtual disk file for a Window"
image: ""
tags: ["Hyper-v", "OneDrive", "VHD", "VHDX", "Virtual Hard Disk", "Virtual Machine", "Windows"]
category: "Hyper-v"
draft: false
lang: ""
---

Virtual hard disk image files ([VHD and VHDX files](https://technet.microsoft.com/en-us/library/hh831446.aspx)) grow bigger during the usage. For instance, this is a 20G virtual disk file for a Windows XP virtual machine:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_thumb_10.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_22.png)

But the actual storage usage is only 5.3GB (19.9GB total space – 14.6GB free space):

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_thumb_11.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_24.png)

Hyper-v Manager provides a button to compact the virtual hard drive:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_thumb_13.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_29.png)

However, it never worked directly. After spending time to try around, the following are the steps truly workable.

## Delete files in VHD/VHDX

First of all, delete whatever not needed in the virtual machine. For example, in this Windows XP virtual machine, these entries can be cleared:

-   C:\\Documents and Settings\\Administrator\\Local Settings\\Temp\\\*
-   C:\\Documents and Settings\\Administrator\\Local Settings\\Temporary Internet Files\\\*
-   C:\\WINDOWS\\$\*
-   C:\\WINDOWS\\SoftwareDistribution\\Download\\\*
-   C:\\WINDOWS\\System32\\dllcache\\\*
-   C:\\WINDOWS\\Temp\\\*
-   etc.

Also, [WinDirStat](https://windirstat.info/index.html) is very helpful to identify the sizes of directories/files:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_thumb_9.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_20.png)

## Defrag the partitions

After cleaning up inside the VHD/VHDX, the next step is defragment. The built in defragment tool in Windows is not powerful enough for the purpose of shrinking. [PerfectDisk](http://www.raxco.com/business/products/perfectdisk-professional) (30 days free trail) could be a nice option:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_4.png)

Start defragment by clicking “Prep for Shrink”. When it is done, click “Boot Time Defrag”:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_thumb_3.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_8.png)

Then virtual machine will be restarted, system files and page files will be defragged:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_thumb_4.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_10.png)

## Shrink the partitions

In Windows XP virtual machine, the built in Disk Management Tool cannot shrink the partition. [Paragon Partition Manager](http://www.paragon-software.com/home/pm-personal/eshop.html) (free edition) can do that:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_thumb_14.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_31.png)

Reboot is required again:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_thumb_15.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_33.png)

After reboot, it will be done:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_thumb_7.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_16.png)

Other tools, like [MiniTool Partition Manager](http://www.partitionwizard.com/), [Disk Genius](http://www.diskgenius.cn) (Chinese language), etc., should also work.

## Shrink the VHD/VHDX files

This is the most tricky part. There are several options:

1.  Use built-in Hyper-v Manager to shrink VHD/VHDX files of a virtual machine. [![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_thumb_16.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_35.png)
2.  Use [VHD Resizer](http://www.bursky.net/wp-content/uploads/2012/07/VhdResizerSetup.zip) to change the size. It only works for VHD, not VHDX.
3.  Use PowerShell command to shrink VHD/VHDX files:
    ```csharp
    Resize-VHD –Path .\dixinyan-vmxp.vhdx –ToMinimumSize
    ```
    

Unfortunately, none of these can work for above virtual hard disk of this Windows XP virtual machine. After trying things around, the following approach works:

-   When shrinking a VHDX, Convert it to VHD then convert it back to VHDX.
-   When shrinking a VHD, convert it to VHDX then convert it back to VHD.

In PowerShell:

```csharp
Convert-VHD -Path .\dixinyan-vmxp.vhdx -DestinationPath .\dixinyan-vmxp.vhd
Convert-VHD -Path .\dixinyan-vmxp.vhd -DestinationPath .\dixinyan-vmxp.min.vhdx
```

Finally, The VHDX is shrunk from 20GB to 6GB:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_thumb_8.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Shrink-a_D28C/image_18.png)