---
title: "Installing Android 6 Marshmallow on Nexus 7"
published: 2015-10-22
description: "I got a ) in 2013. In 2014 it was upgraded to , and then became way slower"
image: ""
tags: ["Android", "Hardware", "Nexus"]
category: "Android"
draft: false
lang: ""
---

I got a [Nexus 7](https://en.wikipedia.org/wiki/Nexus_7_\(2013\)) in 2013. In 2014 it was upgraded to [Android 5.0 Lollipop](https://en.wikipedia.org/wiki/Android_Lollipop), and then became way slower. This month, Google released [Android 6.0.0 factory images - build MRA58K](https://developers.google.com/android/nexus/images), Nexus 7 2013 included. So maybe it is time to refresh the device.

Here are the steps of installing from [Windows 10](https://en.wikipedia.org/wiki/Windows_10):

1.  Prepare Nexus
    -   In Settings/Developer options, enable Debug with USB.
    -   In Settings/Storage, change connection mode to Camera (PTP).
    -   Connect device to PC.
2.  Download USB driver, adb tool ([Android debug bridge](http://developer.android.com/tools/help/adb.html)), and fastboot tool. There are 2 ways:
    -   Download [Android SDK](http://developer.android.com/sdk/index.html), and install. After that, run SDK Manager, download adb, USB driver, and fastboot. [![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Installing_13E2D/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Installing_13E2D/image_2.png) The USB driver won’t automatically installed. It can be installed manually from Device Manager. When it is done shows up: [![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Installing_13E2D/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Installing_13E2D/image_4.png)
    -   The much faster way is to install [Minimal ADB and Fastboot](http://forum.xda-developers.com/showthread.php?t=2317790), and download [USB driver directly](http://developer.android.com/sdk/win-usb.html#download).
    -   When this step is done, “adb devices” command should list the device:
        
        > List of devices attached 0a3d6f90 device
        
3.  Unlock bootloader. Use “adb reboot bootloader” command to reboot device, then unlock it with “fastboot oem unlock”:
    
    > ... (bootloader) Unlocking bootloader... (bootloader) erasing userdata... (bootloader) erasing userdata done (bootloader) erasing cache... (bootloader) erasing cache done (bootloader) Unlocking bootloader done! OKAY \[ 77.208s\] finished. total time: 77.208s
    
    On Nexus, use the volume up/down and power buttons to confirm unlock.
4.  Download the factory images from the [official links](https://developers.google.com/android/nexus/images), and extract the files. There will be only 6 files, including a flash-all.bat. Run it. Then it’s done
5.  Nexus reboots automatically. It rebooted forever for the first time. I had to hold the power button to turn it off. Then it cannot be turned on. A little scary. I held the power button for 30 seconds, it lit up.

Here is the 2 years old Nexus with Marshmallow:

[![Screenshot_20151022-003913](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Installing_13E2D/Screenshot_20151022-003913_thumb.png "Screenshot_20151022-003913")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Installing_13E2D/Screenshot_20151022-003913_2.png)

[![Screenshot_20151022-003352](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Installing_13E2D/Screenshot_20151022-003352_thumb.png "Screenshot_20151022-003352")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Installing_13E2D/Screenshot_20151022-003352_2.png)