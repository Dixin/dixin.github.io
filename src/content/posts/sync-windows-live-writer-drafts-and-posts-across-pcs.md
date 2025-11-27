---
title: "Sync Windows Live Writer Drafts and Posts Across PCs"
published: 2016-01-27
description: "Windows Live Writer saves drafts and posts under Documents\\My Weblog Posts. To sync this directory with OneDrive, just move it to OneDrive (e.g. OneDrive\\Documents\\WindowsLiveWriter), and create a"
image: ""
tags: ["Windows Live", "Windows Live Writer"]
category: "Windows Live"
draft: false
lang: ""
---

## Sync files through OneDrive

Windows Live Writer saves drafts and posts under Documents\\My Weblog Posts. To sync this directory with OneDrive, just move it to OneDrive (e.g. OneDrive\\Documents\\WindowsLiveWriter), and create a junction to redirect:

> D:\\Documents>mklink /J "My Weblog Posts" "D:\\OneDrive\\Documents\\WindowsLiveWriter"
> 
> Junction created for My Weblog Posts <<===>> D:\\OneDrive\\Documents\\WindowsLiveWriter

After doing this for each PC, all Windows Live Writer files are in sync.

## Sync destination blog id

With the above step, draft files (Documents\\My Weblog Posts\\Drafts\\\*.wpost) can work across PCs, but posts (Documents\\My Weblog Posts\\Recent Posts\\\*.wpost) cannot. In the following scenario:

-   In PC 1, writes a draft and post it to blog. There will be a post file saved, e.g.: Documents\\My Weblog Posts\\Recent Posts\\LINQ via C#.wpost.
-   In PC 2, opens Documents\\My Weblog Posts\\Recent Posts\\LINQ via C#.wpost, edit it and post to blog again.

In the blog, the original post is not updated. Instead, a new entry is posted to blog. and a new post file is saved to local as Documents\\My Weblog Posts\\Recent Posts\\LINQ via C#\[2\].wpost. The same issue happens when Windows is reinstalled in the same PC.

So why is LINQ via C#\[2\].wpost generated? What is the difference from LINQ via C#.wpost? These 2 files can be compared with Code Compare:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Recover_C7EE/image_thumb_4.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Recover_C7EE/image_10.png)

It looks .wpost files are binary files. So try to open them with 7-zip. Bingo:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Recover_C7EE/image_thumb_3.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Recover_C7EE/image_8.png)

So extract the contents of LINQ via C#.wpost and LINQ via C#\[2\].wpost to 2 directories, and compares the directories again with Code Compare:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Recover_C7EE/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Recover_C7EE/image_2.png)

It turns out the DestinationBlogId is the problem:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Recover_C7EE/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Recover_C7EE/image_6.png)

They are 2 different GUIDs. Now search the GUID from LINQ via C#\[2\].wpost in PC 2’s registry, it is under HKEY\_CURRENT\_USER\\SOFTWARE\\Microsoft\\Windows Live\\Writer\\Weblogs\\:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Recover_C7EE/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Recover_C7EE/image_4.png)

Apparently, it is a generated id when configuring Windows Live Writer to add the blog with credentials. Simply press F2 to rename it to the other GUID. Then, repeat this for all the PCs to have the same blog id, the problem is resolved. Now editing post files will update the original blog entry.

## Appendix: Enable HTML5 support

Windows Live Writer does not work with this blog’s theme, trying to update the them will fails, and the Windows Live Writer’s log shows errors. The reason is the editor is rendered with IE in IE 7 mode, so later technologies like HTML5 and CSS3 cannot be supported. Fortunately, [there is a simple solution](http://weblogs.asp.net/jongalloway/8-windows-live-writer-tips). In registry, under HKEY\_LOCAL\_MACHINE\\SOFTWARE\\Wow6432Node\\Microsoft\\Internet Explorer\\Main\\FeatureControl\\FEATURE\_BROWSER\_EMULATION, add a value “WindowsLiveWriter.exe”, with DWORD data “9000”, which means IE9 mode of IE11 on Windows 10. Problem resolved. 9000 is specified here instead of 11000, because Windows Live Writer does not render tables correctly in IE10 and IE11 mode.