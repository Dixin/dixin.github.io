---
title: "Batch Processing Compression Archives with Different Formats (RAR, ISO, 7z, Zip, …) in C#"
published: 2016-03-02
description: "](http://techheavy.s3.a"
image: ""
tags: ["RAR", "Zip", "ISO", "7z", "7-Zip", "Conpression", "Extraction", "C#"]
category: "RAR"
draft: false
lang: ""
---

[![compress](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Batch-processing-RAR-and-Zip_13247/compress_89982e7a-0617-49d7-af84-f4364e62426c.jpg "compress")](http://techheavy.s3.amazonaws.com/wp-content/uploads/2014/02/compress.jpg)

Recently I need to batch process some compressed files in several hard disk drives - Some [RAR](http://en.wikipedia.org/wiki/RAR)/[ISO](http://en.wikipedia.org/wiki/ISO_image)/[7z](http://en.wikipedia.org/wiki/7z) files need to unified to [zip](http://en.wikipedia.org/wiki/Zip_\(file_format\)) format; And some compression archives has to be extracted; etc..

## C# options for compression archive (RAR, ISO, 7z, zip, …) processing

For compression archive processing, there are some nice .NET libraries, like [SharpCompress](https://github.com/adamhathcock/sharpcompress). For example, it provides an easy way to programmatically extract an archive:
```
ArchiveFactory.WriteToDirectory(rarFile, destinationDirectory);
```

So there creates an possibility to convert RAR to zip, by extracting RAR then re-compressing to zip.

To create or extract zip files, now it seems much easier, since .NET has a built-in [ZipFile class](http://msdn.microsoft.com/en-us/library/system.io.compression.zipfile\(v=vs.110\).aspx) since [4.5](http://en.wikipedia.org/wiki/.NET_Framework_version_history#.NET_Framework_4.5):
```
ZipFile.CreateFromDirectory(destinationDirectory, zipFile, CompressionLevel.Optimal, false);
ZipFile.ExtractToDirectory(zipFile, destinationDirectory);
```

And the third free solution is [7-Zip](http://en.wikipedia.org/wiki/7-Zip). I used it for years and I am satisfied with its compression ratio.

### The entry name encoding/decoding problem

When examining these options, my biggest concern is the entry name encoding. When I use Windows File Explorer to process zip archives, the entry name encoding/decoding has been a nightmare for years. I got non-English file/directory names like:

-   ╞╗╣√╕╔╧╕░√╡─│╔╣ª╙ª╙├.pdf
-   ╞╗╣√╕╔╧╕░√╬¬└╧╗»║═╩▄╦≡╡─╞ñ╖⌠╠ß╣⌐┴╦╨┬╡─╔·╗·.pdf
-   ┤╠╝ñ╞ñ╖⌠╕╔╧╕░√┤┘╜°╞ñ╖⌠╖╡└╧╗╣═».pdf

etc..

So I looked into the source code of [System.IO.Compression.dll](http://msdn.microsoft.com/en-us/library/system.io.compression\(v=vs.110\).aspx). This is how it handles file/directory names in [ZipArchiveEntry class](http://msdn.microsoft.com/en-us/library/system.io.compression.ziparchiveentry%28v=vs.110%29.aspx):

```csharp
private string DecodeEntryName(byte[] entryNameBytes)
{
    Encoding encoding;
    if ((ushort)(this._generalPurposeBitFlag & ZipArchiveEntry.BitFlagValues.UnicodeFileName) == 0)
    {
        encoding = ((this._archive == null) ? Encoding.GetEncoding(0) : (this._archive.EntryNameEncoding ?? Encoding.GetEncoding(0)));
    }
    else
    {
        encoding = Encoding.UTF8;
    }
    return new string(encoding.GetChars(entryNameBytes));
}

private byte[] EncodeEntryName(string entryName, out bool isUTF8)
{
    Encoding encoding;
    if (this._archive != null && this._archive.EntryNameEncoding != null)
    {
        encoding = this._archive.EntryNameEncoding;
    }
    else
    {
        encoding = (ZipHelper.RequiresUnicode(entryName) ? Encoding.UTF8 : Encoding.GetEncoding(0));
    }
    isUTF8 = (encoding is UTF8Encoding && encoding.Equals(Encoding.UTF8));
    return encoding.GetBytes(entryName);
}
```

The underlined Encoding.GetEncoding(0) [is the flaky part](http://msdn.microsoft.com/en-us/library/wzsz3bk3%28v=vs.110%29.aspx):

> The ANSI code pages can be different on different computers, or can be changed for a single computer, leading to data corruption. For this reason, encoding and decoding data using the default code page returned by Encoding.GetEncoding(0) is not recommended.

In SharpCompress, entry name is handled in [ZipFileEntry class](https://github.com/adamhathcock/sharpcompress/blob/master/SharpCompress/Common/Zip/Headers/ZipFileEntry..cs) and [ArchiveEncoding class](https://github.com/adamhathcock/sharpcompress/blob/master/SharpCompress/Common/ArchiveEncoding.cs):

```csharp
internal abstract class ZipFileEntry : ZipHeader
{
    protected string DecodeString(byte[] str)
    {
        if (FlagUtility.HasFlag(Flags, HeaderFlags.UTF8))
        {
            return Encoding.UTF8.GetString(str, 0, str.Length);
        }
        return ArchiveEncoding.Default.GetString(str, 0, str.Length);
    }
}

public class ArchiveEncoding
{
    static ArchiveEncoding()
    {
#if PORTABLE || NETFX_CORE
        Default = Encoding.UTF8;
        Password = Encoding.UTF8;
#else
        Default = Encoding.GetEncoding(CultureInfo.CurrentCulture.TextInfo.OEMCodePage);
        Password = Encoding.Default;
#endif
    }
}
```

The underlined CultureInfo.CurrentCulture is not the preference either.

So finally, 7-Zip seems to be the choice, regarding:

-   I haven’t got a chance to look into its [source code](http://sourceforge.net/projects/sevenzip/files/7-Zip/9.34/7z934-src.7z/download) yet. But I have used 7-Zip for years, never encounter entry name issues.
-   It can extract [a wide range of formats](http://en.wikipedia.org/wiki/7-Zip#Others), which helps unifying archives to zip.
-   It creates zip archive, and the compression ratio is satisfying.

[![Quality-and-Efficient-File-Compression-to-Suit-Your-Needs](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Batch-processing-RAR-and-Zip_13247/Quality-and-Efficient-File-Compression-to-Suit-Your-Needs_5.png "Quality-and-Efficient-File-Compression-to-Suit-Your-Needs")](http://zip-7.com/wp-content/uploads/2014/11/Quality-and-Efficient-File-Compression-to-Suit-Your-Needs.png)

## Prepare to use 7z.exe command line tool

On 7-Zip’s website, [the latest SDK](http://sourceforge.net/projects/sevenzip/files/LZMA%20SDK/lzma922.tar.bz2/download) is released in 2011, and [the latest binary](http://sourceforge.net/projects/sevenzip/files/7-Zip/9.34/7z934-x64.msi/download) is released in Nov 2014. So the plan is to go with the binary.

To invoke the 7z.exe command line tool, a helper function is needed to:

-   invoke 7z.exe command line tool.
-   Wait for 7z.exe to finish executing.
-   Grab all messages and errors from 7z.exe.
```
public static class ProcessHelper
{
    public static int StartAndWait(string fileName, string arguments, Action<string> outputReceived = null, Action<string> errorReceived = null)
    {
        using (Process process = new Process()
        {
            StartInfo = new ProcessStartInfo()
            {
                FileName = fileName,
                Arguments = arguments,
                CreateNoWindow = true,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            }
        })
        {
            if (outputReceived != null)
            {
                process.OutputDataReceived += (sender, args) => outputReceived(args.Data);
            }

            if (errorReceived != null)
            {
                process.ErrorDataReceived += (sender, args) => errorReceived(args.Data);
            }
                
            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();
            process.WaitForExit();
            return process.ExitCode;
        }
    }
}
```

When there is output message/error message from the created process, the outputReceived/errorReceived callback functions will be invoked.

Also the implementation starts with an empty 7Z.exe wrapper:

```csharp
public class SevenZip
{
    // http://sevenzip.sourceforge.jp/chm/cmdline/switches/method.htm#Zip 
    private const int DefaultCompressionLevel = 9;

    private static readonly int processorCount = Environment.ProcessorCount;

    private readonly string sevenZ;

    public SevenZip(string sevenZ)
    {
        this.sevenZ = sevenZ;
    }
}
```

Instead of developing a direct conversion algorithm between RAR/ISO/… and zip format, I would [keep it simple stupid](http://en.wikipedia.org/wiki/KISS_principle):

1.  Extract RAR archive entries to a temp folder (x command)
2.  Compress temp folder entries to zip archive (a command).
3.  Delete the temp folder.
4.  Delete the RAR archive.

Now some basic functions can be added to SevenZip class.

## Extract entries from RAR/ISO/7z/… archive

To extract an archive, [the command format](http://sevenzip.sourceforge.jp/chm/cmdline/commands/extract_full.htm) is:

> 7z.exe x {archiveFileName} -y -r -o{destinationDirectoryName}

So the code is straightforward:
```
public void Extract(
    string archive, 
    string destination = null, 
    bool deleteArchive = false, 
    Action<string> logger = null)
{
    destination = !string.IsNullOrWhiteSpace(destination)
        ? destination
        : Path.Combine(Path.GetDirectoryName(archive), Path.GetFileNameWithoutExtension(archive));
    "Start extracting {0} to {1}".FormatWith(archive, destination).LogWith(logger);
    ProcessHelper.StartAndWait(
        this.sevenZ,
        @"x ""{0}"" -y -r -o""{1}""".FormatWith(archive, destination),
        message => message.LogWith(logger),
        error => error.LogWith(logger));
    "End extracting {0} to {1}".FormatWith(archive, destination).LogWith(logger);

    if (deleteArchive)
    {
        DeleteFile(archive, logger);
    }
}
```

When destination directory is missing, entries will be extracted to a directory with the same name as the archive.

The invocation is extremely simple:
```
SevenZip sevenZip = new SevenZip(@"D:\Software\7zip\7z.exe");
sevenZip.Extract(@"D:\Temp\a.rar"); // D:\Temp\a.rar -> D:\Temp\a\.
```

## Create zip archive

[![Simple_Comic_zip](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Batch-processing-RAR-and-Zip_13247/Simple_Comic_zip_3.png "Simple_Comic_zip")](http://upload.wikimedia.org/wikipedia/commons/f/fa/Simple_Comic_zip.png)

To create zip archive from a file/directory, [the command format](http://sevenzip.sourceforge.jp/chm/cmdline/commands/add.htm) is:

> 7z.exe a {zipFileName} {sourceFile} -tzip -r -mx={compressionLevel} -mmt={threadCount} -p{password}
> 
> 7z.exe a {zipFileName} {sourceDirectory}\\\* -tzip -r -mx={compressionLevel} -mmt={threadCount} -p{password}

So a general function will be:
```
public void Zip(
    string source,
    string zip = null,
    Action<string> logger = null,
    string password = null,
    int level = DefaultCompressionLevel)
{
    level = FormatCompressionLevel(level);
    zip = !string.IsNullOrWhiteSpace(zip) ? zip : "{0}.zip".FormatWith(source);
    string passwordArgument = string.IsNullOrEmpty(password) ? null : "-p{0}".FormatWith(password);

    "Start creating {0} from {1}".FormatWith(zip, source).LogWith(logger);
    ProcessHelper.StartAndWait(
        this.sevenZ,
        @"a ""{0}"" ""{1}""  -tzip -r -mx={2} -mmt={3} {4}".FormatWith(zip, source, level, processorCount, passwordArgument),
        message => message.LogWith(logger),
        error => error.LogWith(logger));
    "End creating {0} from {1}".FormatWith(zip, source).LogWith(logger);
}
```

where FormatComptression() is a tiny function to ensure [the compression level of zip is in the range of 0-9](http://sevenzip.sourceforge.jp/chm/cmdline/switches/method.htm#Zip):

```csharp
private static int FormatCompressionLevel(int level)
{
    // http://sevenzip.sourceforge.jp/chm/cmdline/switches/method.htm#Zip
    if (level < 0)
    {
        return 0;
    }

    if (level > 9)
    {
        return 9;
    }

    return level;
}
```

And this demonstrates how to zip a single file/all entries inside a directory:
```
sevenZip.Zip(@"D:\Temp\SingleFile", @"D:\Temp\SingleFile.zip");
sevenZip.Zip(@"D:\Temp\Directory\*", @"D:\Temp\Directory.zip");
```

## Delete a file/directory

In the above Extract() function, a DeleteFile() function is used. Yes, here a little trick is needed to delete file/directory:

```csharp
public static class FileHelper
{
    public static void Delete(string file)
    {
        File.SetAttributes(file, FileAttributes.Normal); // In case file is readonly.
        File.Delete(file);
    }
}

public static class DirectoryHelper
{
    public static void Delete(string directory)
    {
        Directory.EnumerateFiles(directory).ForEach(FileHelper.Delete);
        Directory.EnumerateDirectories(directory).ForEach(Delete);
        Directory.Delete(directory, false);
    }
}

public class SevenZip
{
    private static void DeleteFile(string file, Action<string> logger = null)
    {
        "Start deleting file {0}".FormatWith(file).LogWith(logger);
        FileHelper.Delete(file);
        "End deleting file {0}".FormatWith(file).LogWith(logger);
    }

    private static void DeleteDirectory(string directory, Action<string> logger = null)
    {
        "Start deleting directory {0}".FormatWith(directory).LogWith(logger);
        DirectoryHelper.Delete(directory);
        "End deleting directory {0}".FormatWith(directory).LogWith(logger);
    }
}
```

The built-in Directory.Delete() and File.Delete() functions are not directly used, because they will fail when some file/directory is read only, which can be a common scenario for entries extracted from ISO archives.

## Convert RAR, ISO, 7z, … archives to zip

Now “converting” an archive becomes very easy:
```
public void ToZip(
    string archive,
    string zip = null,
    bool deleteArchive = false,
    Action<string> logger = null,
    int level = DefaultCompressionLevel)
{
    // Create temp directory.
    string tempDirectory = Path.Combine(Path.GetTempPath(), Path.GetRandomFileName());
    Directory.CreateDirectory(tempDirectory);

    try
    {
        // Extract archive entries to temp directory.
        this.Extract(archive, tempDirectory, false, logger);

        // Compress temp directory entries (tempDirectory\*) to zip.
        string zipFullName = string.IsNullOrWhiteSpace(zip) ? Path.ChangeExtension(archive, "zip") : zip;
        this.Zip(Path.Combine(tempDirectory, "*"), zipFullName, logger, null, level);

        if (deleteArchive)
        {
            // Delete archive.
            DeleteFile(archive, logger);
        }
    }
    finally
    {
        // Delete temp directory.
        DeleteDirectory(tempDirectory, logger);
    }
}
```

The invocation is easy too:
```
sevenZip.ToZip(@"D:\Temp\b.rar", null /* By default D:\Temp\b.zip */, true, Console.Write);
```

## Batch process

To batch convert all archives within a certain directory, just need a little recursion:
```
public void AllToZips(
    string directory,
    string[] archiveExtensions,
    Func<string, string> zipFile = null,
    bool deleteArchive = false,
    bool isRecursive = false,
    Action<string> logger = null,
    int level = DefaultCompressionLevel)
{
    Directory
        .EnumerateFiles(directory)
        .Where(file => archiveExtensions.Contains(Path.GetExtension(file), StringComparer.InvariantCultureIgnoreCase))
        .ForEach(archive => this.ToZip(archive, zipFile != null ? zipFile(archive) : null, deleteArchive, logger, level));

    if (isRecursive)
    {
        Directory
            .EnumerateDirectories(directory)
            .ForEach(subDirectory =>
            this.AllToZips(subDirectory, archiveExtensions, zipFile, deleteArchive, true, logger, level));
    }
}
```

The invocation will be like:
```
sevenZip.AllToZips(
    @"\\dixinyan-disk\sda1\Files\",
    new string[] { ".rar", ".iso", ".7z" },
    null, // By default, take original archive's name as zip file's name (abc.rar -> abc.zip).
    true, // Delete original archive.
    true, // Process sub directories recursively.
    Console.Write);
```

I also need to batch “convert” bunch of archives to files/directories for direct access:
```
public void ExtractAll(
    string directory,
    string[] archiveExtensions,
    Func<string, string> destinationDirectory = null,
    bool deleteArchive = false,
    bool isRecursive = false,
    Action<string> logger = null)
{
    Directory
        .EnumerateFiles(directory)
        .Where(file => archiveExtensions.Contains(Path.GetExtension(file), StringComparer.InvariantCultureIgnoreCase))
        .ForEach(archive => this.Extract(
            archive, destinationDirectory != null ? destinationDirectory(archive) : null, deleteArchive, logger));

    if (isRecursive)
    {
        Directory
            .EnumerateDirectories(directory)
            .ForEach(subDirectory => this.ExtractAll(
                subDirectory, archiveExtensions, destinationDirectory, deleteArchive, true, logger));
    }
}
```

## Encrypt/hide file names in zip

[![Top-3-Best-Compression-Tools](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Batch-processing-RAR-and-Zip_13247/Top-3-Best-Compression-Tools_5960e63c-2b80-4a0b-a4b2-28e7a023a6e7.png "Top-3-Best-Compression-Tools")](http://zip-7.com/wp-content/uploads/2014/10/Top-3-Best-Compression-Tools.png)

After converting RAR to zip, there is a big disadvantage. RAR can encrypt/hide entry names in the archive, but zip cannot. Again, a [simple stupid](http://en.wikipedia.org/wiki/KISS_principle) way is to [double zip](http://kb.winzip.com/kb/entry/147/):

1.  First pass: zip entries into an archive without encryption
2.  Second pass: zip that archive with encryption
```
public void DoubleZip(
    string source,
    string password,
    Func<string, string> intermediateFile = null,
    Action<string> logger = null,
    int level = DefaultCompressionLevel)
{
    intermediateFile = intermediateFile ?? (name => "{0}..zip".FormatWith(source));

    string firstPassZip = intermediateFile(source);
    this.Zip(source, firstPassZip, logger, null, level);

    string secondPassZip = "{0}.zip".FormatWith(source);
    this.Zip(firstPassZip, secondPassZip, logger, password, level);

    DeleteFile(firstPassZip, logger);
}
```

## Conclusion

With the help of 7z.exe, I have programmatically extracted many archives, and also batch “converted” tons of fancy archives (mostly in RAR, ISO, and 7z format) to zip archives.

The complete code can be downloaded [here](https://aspblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/Batch-processing-RAR-and-Zip_13247/SevenZip.cs) - including the SevenZip class and all extension methods/helper classes used above.

If you have a better approach to encrypt/hide entry names in zip archives, please share :)