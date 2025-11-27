---
title: "Windows 10 and 11 minimal setup for HDR video playback and streaming"
published: 2021-11-14
description: "On last Black Friday, I purchased a 50-inch 4K HDR10 smart TV with only $150. I use it as monitor for my computer. I didn’t find a walk through tutorial for the whole HDR (High Dynamic Range) setup, s"
image: ""
tags: ["Windows 10", "Windows 11"]
category: "Windows 10"
draft: false
lang: ""
---

On last Black Friday, I purchased a 50-inch 4K HDR10 smart TV with only $150. I use it as monitor for my computer. I didn’t find a walk through tutorial for the whole HDR (High Dynamic Range) setup, so here I am sharing the steps.

## Prerequisites

Hardware:

-   Graphic card must support HDR. For example:

-   Nvidia GeForce GTX 900, 10 series, 16 series and RTX 20 series, 30 series
-   AMD Polaris Series, Vega series, Big Navi series

-   Monitor or TV must have the HDR feature, including DP 1.4 or HDMI 2.0 support. Other fancy features, like 10 bit color, FreeSync, G-Sync, etc., are not relevant to HDR.
-   Video cable must be DP 1.4 or HDMI 2.0 or higher.

Software:

-   Windows 11 or Windows 10 version 1803 or later.
-   Video player must support HDR.
-   Video file or stream must be HDR encoded.

## Setup TV/monitor

Make sure the TV/monitor’s HDMI 2.0/DP 1.4 mode is enabled. “Auto” does not work on my TV. Switching to 2.0 makes it work.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Windows-10-HDR-and_12389/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Windows-10-HDR-and_12389/image_15.png)

## Windows and graphic card configuration

Installing the latest Windows 10 build version 20H2, switch the default power plan from Balanced to High Performance.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Windows-10-HDR-and_12389/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Windows-10-HDR-and_12389/image_2.png)

Install the latest graphic card driver, switch Output dynamic range from Limited to Full.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Windows-10-HDR-and_12389/image_thumb_3.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Windows-10-HDR-and_12389/image_8.png)

And switch to Dynamic range from Limited to Full:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Windows-10-HDR-and_12389/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Windows-10-HDR-and_12389/image_6.png)

## Setup video player and filter

For player, there are many options, like MPC-HC, MPC-BE, MPV, Pot Player, etc. I use MPC-HC (Media Player Classic Home Cinema), because I am used to it for more than a decade. And it is open source [https://github.com/clsid2/mpc-hc](https://github.com/clsid2/mpc-hc "https://github.com/clsid2/mpc-hc"). It can be easily installed via winget:

> winget install –id clsid2.mpc-hc

After trying many things around, I found MadVR works the best and easist for playing normal and HDR videos. It can be installed from official website [http://madvr.com/](http://madvr.com/ "http://madvr.com/"), or from Chocolatey:

> choco install madvr

Launch video player, in the options, go to Playback –> Output, for “DirectShow Video” select “madVR” from the dropdown list.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Windows-10-HDR-and_12389/image_thumb_9.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Windows-10-HDR-and_12389/image_22.png)

Then Go to Internal Filters, click “Video decoder” button, the Properties panel pops up. For “Hardware Decoder to use”, select whatever works for your machine. For my computer, “DXVA2 (copy-back)” and “NVIDIA CUVID” both work.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Windows-10-HDR-and_12389/image_thumb_11.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Windows-10-HDR-and_12389/image_26.png)

Then launch madVR settings. You can go to its installation folder (e.g. C:\\ProgramData\\chocolatey\\lib\\madvr\\tools), launch madHcCtrl.exe. It is luanched and minimized to the system tray. Right click the system tray icon, click “Edit madVR settings” in the menu.

FIrst, go to devices, find your monitor, and select the correct device type:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Windows-10-HDR-and_12389/image_thumb_10.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Windows-10-HDR-and_12389/image_24.png)

Then go to devices –> Your monitor –> properties, select 0-255 for the level, and select the correct color depth.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Windows-10-HDR-and_12389/image_thumb_4.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Setup-Windows-10-HDR-and_12389/image_10.png)

Now you should be able to play HDR video files.

This article documents the minimal setup for HDR on Windows 10 and Windows 11. There are tons of more madVR settings to tweak if you have time and interest. Please see the following tools and tutorials:

-   [https://github.com/gehrleib/MPC-BE-with-madVR](https://github.com/gehrleib/MPC-BE-with-madVR "https://github.com/gehrleib/MPC-BE-with-madVR")
-   [https://anime.my/tutorials/madvr/](https://anime.my/tutorials/madvr/ "https://anime.my/tutorials/madvr/")