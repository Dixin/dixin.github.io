---
title: "Port Microsoft Concurrency Visualizer SDK to .NET Standard and NuGet"
published: 2025-01-24
description: "I uploaded a NuGet package of Microsoft Concurrency Visualizer SDK: . [Microsoft Concurrency Visualizer](https://docs.micr"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "Concurrency VIsualizer", "NuGet", "SDK", "Visual Studio"]
category: ".NET"
draft: false
lang: ""
---

I uploaded a NuGet package of Microsoft Concurrency Visualizer SDK: [ConcurrencyVisualizer](https://www.nuget.org/packages/ConcurrencyVisualizer/). [Microsoft Concurrency Visualizer](https://docs.microsoft.com/en-us/visualstudio/profiling/concurrency-visualizer) is an extension tool for Visual Studio. It is a great tool for performance profiling and multithreading execution visualization. It also has a [SDK library](https://docs.microsoft.com/en-us/visualstudio/profiling/concurrency-visualizer-sdk) to be invoked by code and draw markers and spans in the timeline. I used it to visualize sequential LINQ and Parallel LINQ (PLINQ) execution in my Functional Programming and LINQ tutorials. For example, array.Where(…).Select(…) sequential LINQ query and array.AsParallel().Where(…).Select(…) Parallel LINQ query can be visualized as following spans:

[![image_thumb11_thumb[6]](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Port-Microsoft-Co.NET-Standard-and-NuGet_E96/image_thumb11_thumb[6]_thumb.png "image_thumb11_thumb[6]")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Port-Microsoft-Co.NET-Standard-and-NuGet_E96/image_thumb11_thumb[6].png)

The Concurrency Visualizer is available in Visual Studio Marketplace:

[![image_thumb[4]](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Port-Microsoft-Co.NET-Standard-and-NuGet_E96/image_thumb[4]_thumb.png "image_thumb[4]")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Port-Microsoft-Co.NET-Standard-and-NuGet_E96/image_thumb[4].png)

And the SDK library is available for .NET Framework, and can be installed from menu item:

[![image_thumb1[4]](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Port-Microsoft-Co.NET-Standard-and-NuGet_E96/image_thumb1[4]_thumb.png "image_thumb1[4]")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Port-Microsoft-Co.NET-Standard-and-NuGet_E96/image_thumb1[4].png)

This adds a reference to local assembly C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Community\\Common7\\IDE\\Extensions\\4hhyuhoo.ghy\\SDK\\Managed\\4.0\\Microsoft.ConcurrencyVisualizer.Markers.dll. For your convenience, I have made a NuGet package:

Install-Package ConcurrencyVisualizer

It makes your code more potable. I have also ported the code to .NET Standard, so now the SDK can work with .NET Framework, .NET Core, etc.:

[![image_thumb2[4]](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Port-Microsoft-Co.NET-Standard-and-NuGet_E96/image_thumb2[4]_thumb.png "image_thumb2[4]")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Port-Microsoft-Co.NET-Standard-and-NuGet_E96/image_thumb2[4].png)

Now the Concurrency Visualizer tool can visualize markers and spans of .NET Core correctly.

[![image_thumb4_thumb[4]](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Port-Microsoft-Co.NET-Standard-and-NuGet_E96/image_thumb4_thumb[4]_thumb.png "image_thumb4_thumb[4]")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Port-Microsoft-Co.NET-Standard-and-NuGet_E96/image_thumb4_thumb[4].png)