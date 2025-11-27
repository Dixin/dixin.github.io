---
title: "Upload any file to FTP server via C#"
published: 2019-01-31
description: "Microsoft has a C# example of uploading file to FTP server in MSDN .aspx"
image: ""
tags: ["Blog"]
category: ""
draft: false
lang: ""
---

Microsoft has a C# example of uploading file to FTP server in MSDN [https://msdn.microsoft.com/en-us/library/ms229715(v=vs.100).aspx](https://msdn.microsoft.com/en-us/library/ms229715\(v=vs.100\).aspx "https://msdn.microsoft.com/en-us/library/ms229715(v=vs.100).aspx") and Microsoft docs [https://docs.microsoft.com/en-us/dotnet/framework/network-programming/how-to-upload-files-with-ftp](https://docs.microsoft.com/en-us/dotnet/framework/network-programming/how-to-upload-files-with-ftp "https://docs.microsoft.com/en-us/dotnet/framework/network-programming/how-to-upload-files-with-ftp"):

```csharp
// Copy the contents of the file to the request stream.  
StreamReader sourceStream = new StreamReader("testfile.txt");
byte[] fileContents = Encoding.UTF8.GetBytes(sourceStream.ReadToEnd());
sourceStream.Close();
request.ContentLength = fileContents.Length;

Stream requestStream = request.GetRequestStream();
requestStream.Write(fileContents, 0, fileContents.Length);
requestStream.Close();
```

It uses StreamReader to read a string from a text file, then encode the string to bytes and upload.

This document’s title has a general title “Upload Files with FTP". However, this approach with StreamReader only works with text file. If the above code is used to upload a binary file, like a picture, the uploaded file on FTP server becomes corrupted. The general options are:

1\. Call File.ReadAllBytes to read the bytes, and write to request stream:

```csharp
byte[] fileContents = File.ReadAllBytes(filePath);
using (Stream requestStream = request.GetRequestStream())
{
    requestStream.Write(fileContents, 0, fileContents.Length);
}
```

2\. Use FileStream to read the file, and copy the file stream to request stream:

```csharp
public static async Task<FtpStatusCode> FtpUploadAsync(string uri, string userName, string password, string filePath)
{
    FtpWebRequest request = (FtpWebRequest)WebRequest.Create(uri);
    request.Method = WebRequestMethods.Ftp.UploadFile;
    request.Credentials = new NetworkCredential(userName, password);
    // request.UsePassive is true by default.

    using (FileStream fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read))
    using (Stream requestStream = request.GetRequestStream())
    {
        await fileStream.CopyToAsync(requestStream);
    }

    using (FtpWebResponse response = (FtpWebResponse)await request.GetResponseAsync())
    {
        return response.StatusCode;
    }
}
```

3\. Use WebClient, which wraps all the above work flow:

```csharp
public static async Task FtpUploadAsync(string uri, string userName, string password, string filePath)
{
    using (WebClient webClient = new WebClient())
    {
        webClient.Credentials = new NetworkCredential(userName, password);
        await webClient.UploadFileTaskAsync(uri, WebRequestMethods.Ftp.UploadFile, filePath);
    }
}
```