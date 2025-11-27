---
title: "Build custom Windows 10 PE"
published: 2019-01-14
description: "Windows PE (WinPE) is a small version of Windows, which can be used to boot up computers from CD or USB disk drive. It is very useful to deploy or repair the desktop or server edition of Windows. For"
image: ""
tags: ["Windows", "Windows PE", "WinPE", "Windows 10"]
category: "Windows"
draft: false
lang: ""
---

Windows PE (WinPE) is a small version of Windows, which can be used to boot up computers from CD or USB disk drive. It is very useful to deploy or repair the desktop or server edition of Windows. For many years I have tried many options to build a WinPE image and create a bootable media, including [the Microsoft official approach](https://docs.microsoft.com/en-us/windows-hardware/manufacture/desktop/winpe-intro). The easiest way I found, is to use a third party tool called “[Win10PE SE project](http://win10se.cwcodes.net/)”. I am sharing this tool with a post, because it is not easy to be found when searching WinPE related keywords.

Win10PE SE can be downloaded from: [http://win10se.cwcodes.net/Compressed/index.php](http://win10se.cwcodes.net/Compressed/index.php "http://win10se.cwcodes.net/Compressed/index.php"). It is a zip package, so just unzip and run. It can load Windows installer files from your [latest genuine Windows 10 ISO](https://www.microsoft.com/en-us/software-download/windows10), and build a Windows PE ISO file, with tons of customization options:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Build-custom-Windows-10-PE_10F27/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Build-custom-Windows-10-PE_10F27/image_4.png)

It can also add Chinese support and Chinese ISO to WinPE, which is extremely helpful for me:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Build-custom-Windows-10-PE_10F27/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Build-custom-Windows-10-PE_10F27/image_6.png)

It can add third party free tools to WinPE, like Total Commander, Firefox, etc.:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Build-custom-Windows-10-PE_10F27/image_thumb_4.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Build-custom-Windows-10-PE_10F27/image_10.png)

When you are done with customization (or just use the default), click “Play” button, it will build a WinPE.iso file in the specified directory. Then you can use tools like [Rufus](https://rufus.akeo.ie/) to make a bootable USB disk drive. Have fun!