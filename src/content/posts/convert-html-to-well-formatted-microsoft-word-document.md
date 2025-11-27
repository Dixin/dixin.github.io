---
title: "Convert HTML to Well-Formatted Microsoft Word Document"
published: 2016-02-23
description: "Recently I wanted to convert my  into a Word document (.doc). The tasks are:"
image: ""
tags: [".NET", "C#", "C# 6.0", "HTML", "LINQ", "LINQ to Objects", "Office", "OneDrive", "Open XML", "VSTO", "XML"]
category: ".NET"
draft: false
lang: ""
---

Recently I wanted to convert my [LINQ via C# tutorial](/posts/linq-via-csharp) into a Word document (.doc). The tasks are:

1.  Download the content of index page of the entire tutorial.
2.  Interpret the index page and get the title/URI of each chapter and its sections.
3.  Download the content of each chapter/section.
4.  Merge all contents as one well formatted document, with:
    -   title
    -   table of contents
    -   header
    -   footer (page number)
    -   etc.

There might be several possible solutions, e.g.:

-   [Node.js](https://nodejs.org/): It is easy to use [JavaScript](http://en.wikipedia.org/wiki/JavaScript) to process downloaded HTML DOM.
-   C#: it is easier to use C# to implement the conversion to Word document.
    -   [Open XML SDK](https://github.com/OfficeDev/Open-XML-SDK): Open XML is a lower level API to build the Word document
    -   [VSTO (Visual Studio Tools for Office)](https://en.wikipedia.org/wiki/Visual_Studio_Tools_for_Office): Microsoft.Office.Interop.Word.dll from VSTO provides APIs to directly automate Word application itself to build a document.

After searching around, I found [CsQuery library](https://www.nuget.org/packages/CsQuery/), which is available from [Nuget](https://www.nuget.org/packages/CsQuery/):

```csharp
Install-Package CsQuery
```

It is a [jQuery](http://jquery.com/)\-like library for DOM process via C#. So The decision is to go with C#.

## Download index page HTML and all contents via CsQuery

The first steps are to download everything from this blog:

1.  Download HTML string from index page: [http://weblogs.asp.net/dixin/linq-via-csharp](/posts/linq-via-csharp), which is easy by just calling WebClient.DownloadString.
2.  In the downloaded HTML string, get the title of the tutorial from the <title> tag of the downloaded HTML string: indexPage\["title"\].Text()
3.  Get the article content of the index page (get rid of HTML page header, footer, sidebar, article comments …): indexPage\["article.blog-post"\]
4.  In the page content, the title of each chapter, which is so easy with jQuery-style API: indexPage\["article.blog-post"\].Children("ol").Children("li")
    1.  Get the title of each section.
    2.  Get the URI of each section from the HTML hyperlink.
        1.  Download HTML string from each section.
        2.  Get the article content of the section page (get rid of HTML page header, footer, sidebar, article comments …)
        3.  In the contents, downgrade the <h1>, <h2>, <h3>, … tags: replace <h7> to <h9>, <h6> to <h8>, … <h2> to <h4>, <h1> to <h3>. This is a must, because later when merge all contents, chapter title will be <h1> and section title will be <h2>. The headings inside each section must downgrade 2 levels. Again, fortunately, this is very easy with jQuery-style API.
        4.  Remove unnecessary hyperlinks.
    3.  Merge all section’s HTML.
5.  Merge all chapters’ HTML.

Here is the crawler code:

```csharp
private static Html DownloadHtml(string indexUrl = @"http://weblogs.asp.net/dixin/linq-via-csharp")
{
    using (WebClient webClient = new WebClient() { Encoding = Encoding.UTF8 })
    {
        Console.WriteLine($"Downloading {indexUrl}.");
        CQ indexPage = webClient.DownloadString(indexUrl);

        CQ article = indexPage["article.blog-post"];
        IEnumerable<IGrouping<string, Tuple<string, string>>> chapters = article
            .Children("ol")
            .Children("li")
            .Select(chapter => chapter.Cq())
            .Select(chapter =>
            {
                Tuple<string, string>[] sections = chapter.Find("h2")
                    .Select(section => section.Cq().Find("a:last"))
                    .Select(section =>
                    {
                        string sectionUrl = section.Attr<string>("href");
                        Console.WriteLine($"Downloading {sectionUrl}.");
                        CQ sectionPage = webClient.DownloadString(sectionUrl);
                                
                        CQ sectionArticle = sectionPage["article.blog-post"];
                        sectionArticle.Children("header").Remove();
                        Enumerable
                            .Range(1, 7)
                            .Reverse()
                            .ForEach(i => sectionArticle
                                .Find($"h{i}").Contents().Unwrap()
                                .Wrap($"<h{i + 2}/>")
                                .Parent()
                                .Find("a").Contents().Unwrap());
                        sectionArticle.Find("pre span").Css("background", string.Empty);
                        sectionArticle.Find("p")
                            .Select(paragraph => paragraph.Cq())
                            .ForEach(paragraph =>
                            {
                                string paragrapgText = paragraph.Text().Trim();
                                if ((paragraph.Children().Length == 0 && string.IsNullOrWhiteSpace(paragrapgText))
                                    || paragrapgText.StartsWith("[LinQ via C#", StringComparison.OrdinalIgnoreCase))
                                {
                                    paragraph.Remove();
                                }
                            });
                        return Tuple.Create(section.Text().Trim(), sectionArticle.Html());
                    })
                    .ToArray();
                return new Grouping<string, Tuple<string, string>>(
                    chapter.Find("h1").Text().Trim(),
                    sections);
            })
            .ToArray();

        return new Html(
            indexPage["title"].Text().Replace("Dixin's Blog -", string.Empty).Trim(),
            chapters);
    }
}
```

WebClient.ncoding has to be specified as UTF8, otherwise the downloaded HTML will be messy. Also above Grouping class is under Microsoft.FSharp.Linq.RuntimeHelpers namespace. This is the only IGrouping<TKey, TElement> implementation that can be found in .NET libraries.

## Represent entire tutorial as one single piece of HTML via T4 template

Above code constructs and returns a Html object, representing all chapters and all sections of the tutorial. The Html type is actually a [T4 template (Text Template Transformation Toolkit)](https://en.wikipedia.org/wiki/Text_Template_Transformation_Toolkit) for the entire tutorial:

```xml
<#@ template language="C#" debug="true" visibility="internal" linePragmas="false" #>
<#@ import namespace="System.Linq" #>
<html>
    <head>
        <title><#= this.Title #></title>
        <style type="text/css">
            table {
                border-collapse: collapse;
            }

            table, th, td {
                border: 1px solid black;
            }
        </style>
    </head>
    <body>
<# 
foreach (IGrouping<string, Tuple<string, string>> chapter in this.Chapters)
{
#>
        <h1><br /><#= chapter.Key #></h1>
<#
    foreach (Tuple<string, string> section in chapter)
    {
#>
        <h2><#= section.Item1 #></h2>
        <#= section.Item2 #>
<#
    }
}
#>
    </body>
</html>
```

As fore mentioned. <h1> represents each chapter title, and <h2> represents each section title. A little CSS is used to unify all tables with 1 pixel solid border. This Html.tt file will automatically generate a Html.cs file, containing above Html type.

The generated Html class is a partial class, so that some custom code can be appended to make is more intuitive:

```csharp
internal partial class Html
{
    internal Html(string title, IEnumerable<IGrouping<string, Tuple<string, string>>> chapters)
    {
        this.Title = title;
        this.Chapters = chapters;
    }

    internal string Title { get; }

    internal IEnumerable<IGrouping<string, Tuple<string, string>>> Chapters { get; }
}
```

Straightforward. To get the HTML string, just need to call Html.TransformText method, which is defined in the generated Html.cs.

## Convert HTML to Word document via VSTO

As fore mentioned, one possible way is to using Microsoft’s Open XML SDK. It is extremely easy with a third party helper [HtmlToOpenXml](https://html2openxml.codeplex.com/), which is also available from [Nuget](https://www.nuget.org/packages/HtmlToOpenXml.dll):

```csharp
Install-Package HtmlToOpenXml.dll
```

Here is the code:

```csharp
private static byte[] HtmlToWord(string html, string fileName)
{
    using (MemoryStream memoryStream = new MemoryStream())
    using (WordprocessingDocument wordDocument = WordprocessingDocument.Create(
        memoryStream, WordprocessingDocumentType.Document))
    {
        MainDocumentPart mainPart = wordDocument.MainDocumentPart;
        if (mainPart == null)
        {
            mainPart = wordDocument.AddMainDocumentPart();
            new Document(new Body()).Save(mainPart);
        }

        HtmlConverter converter = new HtmlConverter(mainPart);
        converter.ImageProcessing = ImageProcessing.AutomaticDownload;
        Body body = mainPart.Document.Body;

        IList<OpenXmlCompositeElement> paragraphs = converter.Parse(html);
        body.Append(paragraphs);

        mainPart.Document.Save();
        return memoryStream.ToArray();
    }
}
```

Unfortunately, the result document’s format is totally messed up. There is no other mature library for this (Microsoft’s [Power Tools for Open XML](https://github.com/OfficeDev/Open-Xml-PowerTools) provides APIs to convert Word document’s [Open XML](https://en.wikipedia.org/wiki/Office_Open_XML) into HTML, but there is no API to convert HTML to Open XML), so the other way, VSTO, will be the solution.

Microsoft word is a powerful application. It can directly open HTML document, and save it as Word document. So the task becomes:

1.  Save above Html object as a HTML document.
2.  Use Word application to open the saved HTML document.
3.  Format the document.
4.  Save the document as word document.

```csharp
private static void ConvertDocument(
    string inputFile, WdOpenFormat inputFormat,
    string outputFile, WdSaveFormat outputFormat,
    Action<Document> format = null,
    bool isWordVisible = false)
{
    Application word = null;
    try
    {
        word = new Application { Visible = isWordVisible };

        Console.WriteLine($"Opening {inputFile} as {inputFormat}.");
        word.Documents.Open(inputFile, Format: inputFormat);
        Document document = word.Documents[inputFile];

        format?.Invoke(document);

        Console.WriteLine($"Saving {outputFile} as {outputFormat}");
        document.SaveAs2(outputFile, outputFormat);
    }
    finally
    {
        word?.Documents?.Close();
        word?.Quit();
    }
}
```

## Format word document via VSTO

The task has the following steps (in order):

1.  Download all referenced pictures (<img> tags in HTML), and save them along with the Word document, so that the document can be viewed offline.
2.  Apply a specified template (.dot) to the Word document. This is the easiest way to format document’s
    -   title
    -   table of contents
    -   header
    -   footer (page number)
    -   etc.
3.  Insert a detailed table of contents to the Word document, which shows all headings of the tutorial.
4.  Insert a abstract table of contents to the Word document, which only shows chapter titles (“Heading 1” fields in Word, or <h1> tags in HTM).
5.  Insert a title to the Word document (“Title” field in word, or <title> tag in HTML)
6.  Insert author next to the title.
7.  Insert page numbers to the Word document footer.
8.  Insert chapter (fields with “Heading 1”) to Word document header via FieldStyleRef.

And the code:

```csharp
private static void FormatDocument(Document document, Html html, string template, string author = "Dixin Yan")
{
    document.InlineShapes
            .OfType<InlineShape>()
            .Where(shape => shape.Type == WdInlineShapeType.wdInlineShapeLinkedPicture)
            .ForEach(picture =>
            {
                Console.WriteLine($"Downloading {picture.LinkFormat.SourceFullName}");
                picture.LinkFormat.SavePictureWithDocument = true;
            });

    Console.WriteLine($"Applying template {template}");
    document.set_AttachedTemplate(template);
    document.UpdateStyles();

    Range range = document.Range(document.Content.Start, document.Content.Start);

    document.TablesOfContents.Add(range);

    TableOfContents table = document.TablesOfContents.Add(range, LowerHeadingLevel: 1);

    Console.WriteLine($"Adding title {html.Title}");
    Paragraph titleParagraph = document.Paragraphs.Add(range);
    titleParagraph.Range.Text = $"{html.Title}{Environment.NewLine}";
    range.set_Style("Title");

    Console.WriteLine($"Adding author {author}");
    range = document.Range(table.Range.Start, table.Range.Start);
    Paragraph authorParagraph = document.Paragraphs.Add(range);
    authorParagraph.Range.Text = $"{author}{Environment.NewLine}";
    range.set_Style("Author");

    range = document.Range(table.Range.End, table.Range.End);
    range.InsertBreak(WdBreakType.wdPageBreak);

    document.Sections.OfType<Section>().ForEach(section =>
    {
        range = section.Headers[WdHeaderFooterIndex.wdHeaderFooterPrimary].Range;
        range.Fields.Add(range, WdFieldType.wdFieldStyleRef, @"""Heading 1""", true);

        section.Footers[WdHeaderFooterIndex.wdHeaderFooterPrimary].PageNumbers.Add(
            WdPageNumberAlignment.wdAlignPageNumberCenter);
    });
}
```

The VSTO programming is not intuitive, and APIs are lack of examples. It was quite time consuming to insert the FieldStyleRef - the style name is not “Heading 1”, but “"Heading 1"”, the double quote around the style ref name is required.

## Save as Word document via VSTO

The is the method to save as Word document (.doc)

```csharp
private static void SaveDocument(Html html, string outputDocument)
{
    string tempHtmlFile = Path.ChangeExtension(Path.GetTempFileName(), "htm");
    string htmlContent = html.TransformText();
    Console.WriteLine($"Saving HTML as {tempHtmlFile}, {htmlContent.Length}.");
    File.WriteAllText(tempHtmlFile, htmlContent);

    string template = Path.Combine(PathHelper.ExecutingDirectory(), "Book.dot");
    ConvertDocument(
        tempHtmlFile, WdOpenFormat.wdOpenFormatWebPages,
        outputDocument, WdSaveFormat.wdFormatDocument,
        document => FormatDocument(document, html, template));
}
```

And this is how to call it:

```csharp
private static void Main(string[] arguments)
{
    string outputDirectory = arguments.Any() && !string.IsNullOrWhiteSpace(arguments.First())
        ? arguments.First()
        : (PathHelper.TryGetOneDrive(out outputDirectory)
            ? Path.Combine(outputDirectory, @"Share\Book")
            : Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory));

    Html html = DownloadHtml();
    SaveDocument(html, Path.Combine(outputDirectory, $"{html.Title}.doc"));
}
```

By default the document is saved to my local OneDrive directory, so that readers and always get the latest version of tutorial from there. If OneDrive does not exist, it is saved to local desktop.

## Share document via OneDrive

To get the OneDrive local path:

1.  First lookup the registry: HKEY\_CURRENT\_USER\\Software\\Microsoft\\OneDrive
2.  If not found, then lookup a .ini file in %LocalApplicationData%\\Microsoft\\OneDrive\\Settings\\Personal

The last line of the .ini file contains the local OneDrive path, e.g.:

> library = 1 4 A3BD24426A36B9EE!129 1388966861 "SkyDrive" Me personal "D:\\SkyDrive"

And here is the implementation of above TryGetOneDriveRoot method:

```csharp
public static bool TryGetOneDriveRoot(out string oneDrive)
{
    oneDrive = Registry.GetValue(
        @"HKEY_CURRENT_USER\Software\Microsoft\OneDrive", "UserFolder", null) as string;
    if (!string.IsNullOrWhiteSpace(oneDrive))
    {
        return true;
    }

    string settingsDirectory = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        @"Microsoft\OneDrive\Settings\Personal");
    if (!Directory.Exists(settingsDirectory))
    {
        return false;
    }

    try
    {
        string datFile = Directory.EnumerateFiles(settingsDirectory, "*.dat").FirstOrDefault();
        string iniFile = Path.ChangeExtension(datFile, "ini");
        oneDrive = File.ReadLines(iniFile)
            .Last(line => !string.IsNullOrWhiteSpace(line))
            .Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries)
            .Last()
            .Trim('"');
        return !string.IsNullOrWhiteSpace(oneDrive);
    }
    catch (Exception exception) when (exception.IsNotCritical())
    {
        return false;
    }
}
```

After saving the file to the right location, it is automatically uploaded to OneDrive:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Convert-HTML-to-Word-Document_DFBE/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Convert-HTML-to-Word-Document_DFBE/image_9.png)

## Conclusion

It is not straightforward to perform the entire job. Many technologies have to be involved:

-   [CsQuery](https://www.nuget.org/packages/CsQuery/) is used for HTML DOM traversal and manipulation
-   [T4 template](https://en.wikipedia.org/wiki/Text_Template_Transformation_Toolkit) is used for HTML merging and formatting.
-   [VSTO](https://en.wikipedia.org/wiki/Visual_Studio_Tools_for_Office) is used to open, format, and save/convert HTML file to Microsoft Word document.
-   [OneDrive](https://en.wikipedia.org/wiki/OneDrive) is used to share the latest build of the document.

The is the final look of the project (Book.csproj):

[![image](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/Convert-HTML-to-Word-Document_DFBE/image_thumb.png "image")](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/Convert-HTML-to-Word-Document_DFBE/image_2.png)

And below is the converted Word document (no manual editing at all):

-   First page: title, author, abstract table of contents [![image](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/Convert-HTML-to-Word-Document_DFBE/image_thumb_2.png "image")](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/Convert-HTML-to-Word-Document_DFBE/image_7.png)
-   Detailed table of contents: [![image](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/Convert-HTML-to-Word-Document_DFBE/image_thumb_3.png "image")](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/Convert-HTML-to-Word-Document_DFBE/image_8.png)
-   Beginning of a chapter: [![image](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/Convert-HTML-to-Word-Document_DFBE/image_thumb_5.png "image")](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/Convert-HTML-to-Word-Document_DFBE/image_12.png)

Currently, the entire tutorial has 558 pages. Hope it helps.