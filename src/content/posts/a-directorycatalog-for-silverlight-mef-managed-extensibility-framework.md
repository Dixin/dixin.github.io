---
title: "A DirectoryCatalog class for Silverlight MEF (Managed Extensibility Framework)"
published: 2011-01-29
description: "In the MEF (Managed Extension Framework) for .NET, there are useful ComposablePartCatalog implementations in System.ComponentModel.Composition.dll, like:"
image: ""
tags: [".NET", "ASP.NET", "C#", "MEF", "Silverlight"]
category: ".NET"
draft: false
lang: ""
---

In the MEF (Managed Extension Framework) for .NET, there are useful ComposablePartCatalog implementations in System.ComponentModel.Composition.dll, like:

-   System.ComponentModel.Composition.Hosting.AggregateCatalog
-   System.ComponentModel.Composition.Hosting.AssemblyCatalog
-   System.ComponentModel.Composition.Hosting.DirectoryCatalog
-   System.ComponentModel.Composition.Hosting.TypeCatalog

While in Silverlight, there is a extra System.ComponentModel.Composition.Hosting.DeploymentCatalog. As a wrapper of AssemblyCatalog, it can load all assemblies in a XAP file in the web server side. Unfortunately, in silverlight there is no DirectoryCatalog to load a folder.

## Background

There are scenarios that Silverlight application may need to load all XAP files in a folder in the web server side, for example:

-   If the Silverlight application is extensible and supports plug-ins, there would be something like�a Plugins folder in the web server, and each pluin would be an individual XAP file in the folder. In this scenario, after the application is loaded and started up, it would like to load all XAP files in Plugins folder.
-   If the aplication supports themes, there would be something like a Themes folder, and each theme would be an individual XAP file too. The application would also need to load all XAP files in Themes.

It is useful if we have a DirectoryCatalog:
```
DirectoryCatalog catalog = new DirectoryCatalog("/Plugins");
catalog.DownloadCompleted += (sender, e) => { };
catalog.DownloadAsync();
```

Obviously, the implementation of DirectoryCatalog is easy. It is just a collection of DeploymentCatalog class.

## Retrieve file list from a directory

Of course, to retrieve file list from a web folder, the folder�s �Directory Browsing� feature must be enabled:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_71CB93DF.png "image")

So when the folder is requested, it responses a list of its files and folders:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_227E9B8B.png "image")

This is nothing but a simple HTML page:

```xml
<html>
    <head>
        <title>localhost - /Folder/</title>
    </head>
    <body>
        <h1>localhost - /Folder/</h1>
        <hr>
        <pre>
            <a href="/">[To Parent Directory]</a><br>
            <br>
            1/3/2011  7:22 PM   185 <a href="/Folder/File.txt">File.txt</a><br>
            1/3/2011  7:22 PM   &lt;dir&gt; <a href="/Folder/Folder/">Folder</a><br>
        </pre>
        <hr>
    </body>
</html>
```

For the ASP.NET Deployment Server of Visual Studio, directory browsing is enabled by default:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_1D2FB4DA.png "image")

The HTML <Body> is almost the same:
```
<body bgcolor="white">
    <h2><i>Directory Listing -- /ClientBin/</i></h2>
    <hr width="100%" size="1" color="silver">
    <pre>
        <a href="/">[To Parent Directory]</a>
        Thursday, January 27, 2011 11:51 PM 282,538 <a href="Test.xap">Test.xap</a>
        Tuesday, January 04, 2011 02:06 AM  &lt;dir&gt; <a href="TestFolder/">TestFolder</a>
    </pre>
    <hr width="100%" size="1" color="silver">
    <b>Version Information:</b>&nbsp;ASP.NET Development Server 10.0.0.0 
</body>
```

The only difference is, IIS�s links start with slash, but here the links do not.

Here one way to get the file list is read the href attributes of the links:

```csharp
[Pure]
private IEnumerable<Uri> GetFilesFromDirectory(string html)
{
    Contract.Requires(html != null);
    Contract.Ensures(Contract.Result<IEnumerable<Uri>>() != null);

    return new Regex(
                    "<a href=\"(?<uriRelative>[^\"]*)\">[^<]*</a>",
                    RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)
                .Matches(html)
                .OfType<Match>()
                .Where(match => match.Success)
                .Select(match => match.Groups["uriRelative"].Value)
                .Where(uriRelative => uriRelative.EndsWith(".xap", StringComparison.Ordinal))
                .Select(uriRelative =>
                    {
                        Uri baseUri = this.Uri.IsAbsoluteUri
                                            ? this.Uri
                                            : new Uri(Application.Current.Host.Source, this.Uri);
                        uriRelative = uriRelative.StartsWith("/", StringComparison.Ordinal)
                                            ? uriRelative
                                            : (baseUri.LocalPath.EndsWith("/", StringComparison.Ordinal)
                                                    ? baseUri.LocalPath + uriRelative
                                                    : baseUri.LocalPath + "/" + uriRelative);
                        return new Uri(baseUri, uriRelative);
                    });
}
```

Please notice the folders� links end with a slash. They are filtered by the second Where() query.

The above method can find files� URIs from the specified IIS folder, or ASP.NET Deployment Server folder while debugging. To support other formats of file list, a constructor is needed to pass into a customized method:
```
/// <summary>
/// Initializes a new instance of the <see cref="T:System.ComponentModel.Composition.Hosting.DirectoryCatalog" /> class with <see cref="T:System.ComponentModel.Composition.Primitives.ComposablePartDefinition" /> objects based on all the XAP files in the specified directory URI.
/// </summary>
/// <param name="uri">
/// URI to the directory to scan for XAPs to add to the catalog.
/// The URI must be absolute, or relative to <see cref="P:System.Windows.Interop.SilverlightHost.Source" />.
/// </param>
/// <param name="getFilesFromDirectory">
/// The method to find files' URIs in the specified directory.
/// </param>
public DirectoryCatalog(Uri uri, Func<string, IEnumerable<Uri>> getFilesFromDirectory)
{
    Contract.Requires(uri != null);

    this._uri = uri;
    this._getFilesFromDirectory = getFilesFromDirectory ?? this.GetFilesFromDirectory;
    this._webClient = new Lazy<WebClient>(() => new WebClient());

    // Initializes other members.
}
```

When the getFilesFromDirectory parameter is null, the above GetFilesFromDirectory() method will be used as default.

## Download the directory�s XAP file list

Now a public method can be created to start the downloading:
```
/// <summary>
/// Begins downloading the XAP files in the directory.
/// </summary>
public void DownloadAsync()
{
    this.ThrowIfDisposed();

    if (Interlocked.CompareExchange(ref this._state, State.DownloadStarted, State.Created) == 0)
    {
        this._webClient.Value.OpenReadCompleted += this.HandleOpenReadCompleted;
        this._webClient.Value.OpenReadAsync(this.Uri, this);
    }
    else
    {
        this.MutateStateOrThrow(State.DownloadCompleted, State.Initialized);
        this.OnDownloadCompleted(new AsyncCompletedEventArgs(null, false, this));
    }
}
```

Here the HandleOpenReadCompleted() method is invoked when the file list HTML is downloaded.

## Download all XAP files

After retrieving all files� URIs, the next thing becomes even easier. HandleOpenReadCompleted() just uses built in DeploymentCatalog to download the XAPs, and aggregate them into one AggregateCatalog:

```csharp
private void HandleOpenReadCompleted(object sender, OpenReadCompletedEventArgs e)
{
    Exception error = e.Error;
    bool cancelled = e.Cancelled;
    if (Interlocked.CompareExchange(ref this._state, State.DownloadCompleted, State.DownloadStarted) !=
        State.DownloadStarted)
    {
        cancelled = true;
    }

    if (error == null && !cancelled)
    {
        try
        {
            using (StreamReader reader = new StreamReader(e.Result))
            {
                string html = reader.ReadToEnd();
                IEnumerable<Uri> uris = this._getFilesFromDirectory(html);

                Contract.Assume(uris != null);

                IEnumerable<DeploymentCatalog> deploymentCatalogs =
                    uris.Select(uri => new DeploymentCatalog(uri));
                deploymentCatalogs.ForEach(
                    deploymentCatalog =>
                    {
                        this._aggregateCatalog.Catalogs.Add(deploymentCatalog);
                        deploymentCatalog.DownloadCompleted += this.HandleDownloadCompleted;
                    });
                deploymentCatalogs.ForEach(deploymentCatalog => deploymentCatalog.DownloadAsync());
            }
        }
        catch (Exception exception)
        {
            error = new InvalidOperationException(Resources.InvalidOperationException_ErrorReadingDirectory, exception);
        }
    }

    // Exception handling.
}
```

In HandleDownloadCompleted(), if all XAPs are downloaded without exception, OnDownloadCompleted() callback method will be invoked.

```csharp
private void HandleDownloadCompleted(object sender, AsyncCompletedEventArgs e)
{
    if (Interlocked.Increment(ref this._downloaded) == this._aggregateCatalog.Catalogs.Count)
    {
        this.OnDownloadCompleted(e);
    }
}
```

## Exception handling

Whether this DirectoryCatelog can work only if the directory browsing feature is enabled. It is important to inform caller when directory cannot be browsed for XAP downloading.

```csharp
private void HandleOpenReadCompleted(object sender, OpenReadCompletedEventArgs e)
{
    Exception error = e.Error;
    bool cancelled = e.Cancelled;
    if (Interlocked.CompareExchange(ref this._state, State.DownloadCompleted, State.DownloadStarted) !=
        State.DownloadStarted)
    {
        cancelled = true;
    }

    if (error == null && !cancelled)
    {
        try
        {
            // No exception thrown when browsing directory. Downloads the listed XAPs.
        }
        catch (Exception exception)
        {
            error = new InvalidOperationException(Resources.InvalidOperationException_ErrorReadingDirectory, exception);
        }
    }

    WebException webException = error as WebException;
    if (webException != null)
    {
        HttpWebResponse webResponse = webException.Response as HttpWebResponse;
        if (webResponse != null)
        {
            // Internally, WebClient uses WebRequest.Create() to create the WebRequest object. Here does the same thing.
            WebRequest request = WebRequest.Create(Application.Current.Host.Source);

            Contract.Assume(request != null);

            if (request.CreatorInstance == WebRequestCreator.ClientHttp &&
                // Silverlight is in client HTTP handling, all HTTP status codes are supported.
                webResponse.StatusCode == HttpStatusCode.Forbidden)
            {
                // When directory browsing is disabled, the HTTP status code is 403 (forbidden).
                error = new InvalidOperationException(
                    Resources.InvalidOperationException_ErrorListingDirectory_ClientHttp, webException);
            }
            else if (request.CreatorInstance == WebRequestCreator.BrowserHttp &&
                // Silverlight is in browser HTTP handling, only 200 and 404 are supported.
                webResponse.StatusCode == HttpStatusCode.NotFound)
            {
                // When directory browsing is disabled, the HTTP status code is 404 (not found).
                error = new InvalidOperationException(
                    Resources.InvalidOperationException_ErrorListingDirectory_BrowserHttp, webException);
            }
        }
    }

    this.OnDownloadCompleted(new AsyncCompletedEventArgs(error, cancelled, this));
}
```

Please notice Silverlight 3+ application can work in�[either client HTTP handling, or browser HTTP handling](http://msdn.microsoft.com/en-us/library/dd920295.aspx). One difference is:

-   In browser HTTP handling, only HTTP status code 200 (OK) and 404 (not OK, including 500, 403, etc.) are supported
-   In client HTTP handling, all HTTP status code are supported

So in above code, exceptions in 2 modes are handled differently.

## Conclusion

Here is the whole DirectoryCatelog�s looking:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_263C405B.png "image")

Please [click here to download the source code](https://aspblogs.blob.core.windows.net/media/dixin/Media/SilverlightMefExtensions.zip), a simple unit test is included. This is a rough implementation. And, for convenience, some design and coding are just following the built in AggregateCatalog class and Deployment class. Please feel free to modify the code, and please kindly tell me if any issue is found.