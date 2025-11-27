---
title: "Understanding The Internet File Blocking and Unblocking"
published: 2009-03-14
description: "On Windows XP SP2 + IE 7 and later Windows, files from Internet are marked. Sometimes this feature causes problems."
image: ""
tags: ["C#", "File System", "NTFS", "Visual Studio", "Windows"]
category: "C#"
draft: false
lang: ""
---

On Windows XP SP2 + IE 7 and later Windows, files from Internet are marked. Sometimes this feature causes problems.

## The Problems

Today when I started [Visual Studio 2008](http://msdn.microsoft.com/en-us/visualc/aa700831.aspx) to run unit tests of [WebOS](http://coolwebos.com), all the tests could not start:

![file-block-1](https://aspblogs.z22.web.core.windows.net/dixin/Media/fileblock1_0AB30D94.gif "file-block-1")

The message is:

![file-block-2](https://aspblogs.z22.web.core.windows.net/dixin/Media/fileblock2_39B5496B.gif "file-block-2")

> Failed to queue test run 'Administrator@DIXIN-LAPTOP 2009-03-14 14:05:49': Test Run deployment issue: The location of the file or directory 'e:\\work\\webos\\source\\test.website.models\\bin\\debug\\test.website.models.dll.config' is not trusted.

To resolve this problem, right click the “not trusted” file, choose “Property”:

![file-block-3](https://aspblogs.z22.web.core.windows.net/dixin/Media/fileblock3_30790E2A.gif "file-block-3")

and click the “Unblock”. Then the unit tests rocks.

This is because the code is extracted from a zip file, and the zip file is downloaded from Gmail. Since the zip file from the Internet is blocked, the extracted files are also blocked.

Another example (not problem) is, if we download a istaller from the Internet, it is also marked as blocked:

![file-block-4](https://aspblogs.z22.web.core.windows.net/dixin/Media/fileblock4_63689E91.png "file-block-4")

And so is the chm file:

![file-block-5](https://aspblogs.z22.web.core.windows.net/dixin/Media/fileblock5_2BD2DDA3.png "file-block-5")

![file-block-6](https://aspblogs.z22.web.core.windows.net/dixin/Media/fileblock6_626088E7.png "file-block-6")

Unblocking is required to browse the chm content.

## The NTFS alternative data streams

This file / directory blocking is provided by default on:

-   Windows XP SP2 with IE 7
-   Later Windows, like Windows Vista

And marking the file / directory as blocked / unblocked is implemented via alternative data stream feature, which is a feature of NTFS file system. The alternative data streams are just some data like key-value pairs attached on a file or folder.

In the above scenarios (My machine is Windows Vista + IE 7), since the file WebOS.zip is downloaded from the Gmail attachment, the file is marked by set such key-value pair:

-   key (data stream name): Zone.Identifier;
-   value (data stream content): \[ZoneTransfer\] ZoneId=3

Here

-   1 = trusted;
-   2 = intranet;
-   3 = Internet;
-   4 = untrusted.

The above alternative data stream can be examined via command line:
```
more < WebOS.zip:Zone.Identifier
```

That is how is WebOS.zip file marked as blocked to enhance the security, and a “Unblock” button appears on the property dialog.

Actually any file / directory marked with this Zone.Identifier alternative data stream is considered from Internet and blocked by the Windows. A test.txt file can be created to test this:
```
echo test > test.txt
```

by checking its property, this test.txt is unblocked of course. Now inject the same Zone.Identifier alternative data stream into test.txt:
```
more < WebOS.zip:Zone.Identifier > test.txt:Zone.Identifier
```

By clicking the “Unblock” button, the key-value pair is removed from the file, so the file is treated as unblocked by Windows.

If the files in the WebOS.zip are extracted without unblocking the WebOS.zip, those file will also have the same alternative data stream, indicating they are from Internet. So they are blocked, just like the above test.website.models.dll.config file.

For more details of how does NTFS alternative data stream come from and how does it work, please check [Wikipedia](http://en.wikipedia.org/wiki/Fork_\(filesystem\)) and [this article](http://www.securityfocus.com/infocus/1822).

## Remove the Zone.Identifier data stream

Several ways can be used to remove the Zone.Identifier data stream to unblock file / directory:

-   Configure Windows to disable this feature
-   Use command lines
-   Use [streams.exe](http://technet.microsoft.com/en-au/sysinternals/bb897440.aspx) provided in [Sysinternals Suite](http://technet.microsoft.com/en-au/sysinternals/bb842062.aspx)
-   Programmatically remove the data stream

To disable this feature in Windows, go to this place:

![file-block-7](https://aspblogs.z22.web.core.windows.net/dixin/Media/fileblock7_0CEC43F8.png "file-block-7")

The type command can be used to remove the data streams:
```
ren WebOS.zip WebOS.zip.bak
type WebOS.zip.bak > WebOS.zip
del WebOS.zip.bak
```

On the second step, the WebOS.zip.bak's data streams does not come to WebOS.zip.

Sometimes we need to bulk unblock files / directories. The [streams.exe](http://technet.microsoft.com/en-au/sysinternals/bb897440.aspx) can remove all data streams from a directory recursively. And [this library](http://www.codeproject.com/KB/cs/ntfsstreams.aspx) can be used to programmatically remove the data stream. It provides useful extension methods like FileSystemInfo.GetAlternateDataStream(), FileSystemInfo.DeleteAlternateDataStream(), so that these methods can be invoked on both FileInfo and DirectoryInfo.

```csharp
using System;
using System.Globalization;
using System.IO;

using Trinet.Core.IO.Ntfs;

public static class FileInfoExtensions
{
    private const string ZoneIdentifierStreamName = "Zone.Identifier";

    public static void Unblock(this FileInfo file)
    {
        if (file == null)
        {
            throw new ArgumentNullException("file");
        }

        if (!file.Exists)
        {
            throw new FileNotFoundException("Unable to find the specified file.", file.FullName);
        }

        if (file.Exists && file.AlternateDataStreamExists(ZoneIdentifierStreamName))
        {
            file.DeleteAlternateDataStream(ZoneIdentifierStreamName);
        }
    }
}

public static class DirectoryInfoExtensions
{
    private const string ZoneIdentifierStreamName = "Zone.Identifier";

    public static void Unblock(this DirectoryInfo directory)
    {
        directory.Unblock(false);
    }

    public static void Unblock(this DirectoryInfo directory, bool isRecursive)
    {
        if (directory == null)
        {
            throw new ArgumentNullException("file");
        }

        if (!directory.Exists)
        {
            throw new DirectoryNotFoundException(string.Format(CultureInfo.InvariantCulture, "The specified directory '{0}' cannot be found.", directory.FullName));
        }

        if (directory.AlternateDataStreamExists(ZoneIdentifierStreamName))
        {
            directory.DeleteAlternateDataStream(ZoneIdentifierStreamName);
        }

        if (!isRecursive)
        {
            return;
        }

        foreach (DirectoryInfo item in directory.GetDirectories())
        {
            item.Unblock(true);
        }

        foreach (FileInfo item in directory.GetFiles())
        {
            item.Unblock();
        }
    }
}
```
[](http://11011.net/software/vspaste)

The above code has been tested on Windows Vista and Windows Server 2008.