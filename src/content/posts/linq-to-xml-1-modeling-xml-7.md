---
title: "LINQ to XML in Depth (1) Modeling XML"
published: 2018-08-15
description: "(eXtensible Markup Language) is widely used to represent, store, and transfer data. Since .NET 3.5, the built in LINQ to XML APIs are provided to enable LINQ q"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[LINQ to XML in Depth series](/archive/?tag=LINQ%20to%20XML)\]

## **Latest version: [https://weblogs.asp.net/dixin/linq-to-xml-1-modeling-xml](/posts/linq-to-xml-1-modeling-xml "https://weblogs.asp.net/dixin/linq-to-xml-1-modeling-xml")**

[XML](https://en.wikipedia.org/wiki/XML) (eXtensible Markup Language) is widely used to represent, store, and transfer data. Since .NET 3.5, the built in LINQ to XML APIs are provided to enable LINQ queries for XML data source. These APIs are located in System.Xml.XDocument NuGet package for .NET Core, and System.Xml.Linq.dll for .NET Framework. LINQ to XML can be viewed as specialized LINQ to Objects, where the objects in memory represents XML structures.

## Imperative vs. declarative paradigm

The XML DOM APIs are provided since .NET Framework 1.0. There a set of Xml\* types in System.Xml namespace representing XML structures. The following list shows their inheritance hierarchy:

-   XmlNamedNodeMap

-   XmlAttributeCollection

-   XmlNode

-   XmlAttribute
-   XmlDocument
-   XmlDocumentFragment
-   XmlEntity
-   XmlLinkedNode

-   XmlCharacterData

-   XmlCDataSection
-   XmlComment
-   XmlSignificantWhitespace
-   XmlText
-   XmlWhitespace

-   XmlDeclaration
-   XmlDocumentType
-   XmlElement
-   XmlEntityReference
-   XmlProcessingInstruction

-   XmlNotation

-   XmlNodeList
-   XmlQualifiedName

These DOM APIs for XML can be used to model and manipulate XML structures in imperative paradigm. Take the following XML fragment as example:

```csharp
<rss version="2.0" xmlns:dixin="https://weblogs.asp.net/dixin">
  <channel>
    <item>
      <title>LINQ via C#</title>
      <link>https://weblogs.asp.net/dixin/linq-via-csharp</link>
      <description>
        <p>This is a tutorial of LINQ and functional programming. Hope it helps.</p>
      </description>
      <pubDate>Mon, 07 Sep 2009 00:00:00 GMT</pubDate>
      <guid isPermaLink="true">https://weblogs.asp.net/dixin/linq-via-csharp</guid>
      <category>C#</category>
      <category>LINQ</category>
      <!--Comment.-->
      <dixin:source>https://github.com/Dixin/CodeSnippets/tree/master/Dixin/Linq</dixin:source>
    </item>
  </channel>
</rss>
```

It is a simple RSS feed with one single <item> element. The following example calls XML DOM APIs to build such a XML tree, and serialize the XML tree to string:

```csharp
internal static class Dom
{
    internal static void CreateAndSerialize()
    {
        XmlNamespaceManager namespaceManager = new XmlNamespaceManager(new NameTable());
        const string NamespacePrefix = "dixin";
        namespaceManager.AddNamespace(NamespacePrefix, "https://weblogs.asp.net/dixin");

        XmlDocument document = new XmlDocument(namespaceManager.NameTable);

        XmlElement rss = document.CreateElement("rss");
        rss.SetAttribute("version", "2.0");
        XmlAttribute attribute = document.CreateAttribute(
            "xmlns", NamespacePrefix, namespaceManager.LookupNamespace("xmlns"));
        attribute.Value = namespaceManager.LookupNamespace(NamespacePrefix);
        rss.SetAttributeNode(attribute);
        document.AppendChild(rss);

        XmlElement channel = document.CreateElement("channel");
        rss.AppendChild(channel);

        XmlElement item = document.CreateElement("item");
        channel.AppendChild(item);

        XmlElement title = document.CreateElement("title");
        title.InnerText = "LINQ via C#";
        item.AppendChild(title);

        XmlElement link = document.CreateElement("link");
        link.InnerText = "https://weblogs.asp.net/dixin/linq-via-csharp";
        item.AppendChild(link);

        XmlElement description = document.CreateElement("description");
        description.InnerXml = "<p>This is a tutorial of LINQ and functional programming. Hope it helps.</p>";
        item.AppendChild(description);

        XmlElement pubDate = document.CreateElement("pubDate");
        pubDate.InnerText = new DateTime(2009, 9, 7).ToString("r");
        item.AppendChild(pubDate);

        XmlElement guid = document.CreateElement("guid");
        guid.InnerText = "https://weblogs.asp.net/dixin/linq-via-csharp";
        guid.SetAttribute("isPermaLink", "true");
        item.AppendChild(guid);

        XmlElement category1 = document.CreateElement("category");
        category1.InnerText = "C#";
        item.AppendChild(category1);

        XmlNode category2 = category1.CloneNode(false);
        category2.InnerText = "LINQ";
        item.AppendChild(category2);

        XmlComment comment = document.CreateComment("Comment.");
        item.AppendChild(comment);

        XmlElement source = document.CreateElement(NamespacePrefix, "source", namespaceManager.LookupNamespace(NamespacePrefix));
        source.InnerText = "https://github.com/Dixin/CodeSnippets/tree/master/Dixin/Linq";
        item.AppendChild(source);

        // Serialize XmlDocument to string.
        StringBuilder xmlString = new StringBuilder();
        XmlWriterSettings settings = new XmlWriterSettings
        {
            Indent = true,
            IndentChars = "  ",
            OmitXmlDeclaration = true
        };
        using (XmlWriter writer = XmlWriter.Create(xmlString, settings))
        {
            document.Save(writer);
        }

        // rssItem.ToString() returns "System.Xml.XmlElement".
        // rssItem.OuterXml returns a single line of XML text.
        xmlString.WriteLine();
    }
}
```

These APIs have a few disadvantages:

-   Any XML structure has to be created with a XmlDocument instance.
-   XML tree has to be built imperatively, node by node.
-   Additional work is needed to manage namespaces and prefixes.
-   Some operations, like serialization, is not straightforward.

Fortunately, LINQ to XML does not work with these Xml\* types. It redesigns a bunch of X\* types under System.Xml.Linq namespace, and enables LINQ queries for these objects. The following list shows the inheritance hierarchy of all the X\* types, as well as each type’s conversion from/to other types, and their overloaded operators:

-   XDeclaration
-   XName: implicit convertible from string, ==, !=
-   XNamespace: implicit convertible from string, + string, ==, !=
-   XObject

-   XAttribute: explicit convertible to string/bool/bool?/int/int?/uint/uint?/long/long?/ulong/ulong?/float/float?/double/double?/decimal/decimal?/DateTime/DateTime?/TimeSpan/TimeSpan?/Guid/Guid?
-   XNode: DeepEquals

-   XComment
-   XContainer

-   XDocument
-   XElement: explicit convertible to string/bool/bool?/int/int?/uint/uint?/long/long?/ulong/ulong?/float/float?/double/double?/decimal/decimal?/DateTime/DateTime?/TimeSpan/TimeSpan?/Guid/Guid?

-   XDocumentType
-   XProcessingInstruction
-   XText

-   XCData

-   XStreamingElement

As the names suggest, e.g., XNode represents a XML node, XDocument represents a XML document, XName represents XML element name or XML attribute name, etc. And apparently, An XML element/attribute name is essentially a string, so XName implements implicit conversion from string, which provides great convenience. The following example builds the same XML tree with the new LINQ to XML types:

```csharp
internal static partial class Modeling
{
    internal static void CreateAndSerialize()
    {
        XNamespace @namespace = "https://weblogs.asp.net/dixin";
        XElement rss = new XElement(
            "rss",
            new XAttribute("version", "2.0"),
            new XAttribute(XNamespace.Xmlns + "dixin", @namespace),
            new XElement(
                "channel",
                new XElement(
                    "item", // Implicitly converted to XName.
                    new XElement("title", "LINQ via C#"),
                    new XElement("link", "https://weblogs.asp.net/dixin/linq-via-csharp"),
                    new XElement(
                        "description",
                        XElement.Parse("<p>This is a tutorial of LINQ and functional programming. Hope it helps.</p>")),
                    new XElement("pubDate", new DateTime(2009, 9, 7).ToString("r")),
                    new XElement(
                        "guid",
                        new XAttribute("isPermaLink", "true"), // "isPermaLink" is implicitly converted to XName.
                        "https://weblogs.asp.net/dixin/linq-via-csharp"),
                    new XElement("category", "C#"),
                    new XElement("category", "LINQ"),
                    new XComment("Comment."),
                    new XElement(
                        @namespace + "source",
                        https://github.com/Dixin/CodeSnippets/tree/master/Dixin/Linq))));
        rss.ToString().WriteLine(); // Serialize XDocument to string.
    }
}
```

The new code is shorter and more intuitive:

-   XML structure can be create on the fly, XDocument is not involved in the entire example.
-   XML tree can be built declaratively.
-   Easier namespace management, with prefix automatically taken care of.
-   To serialize an XML tree, simply call ToString.

## Types, conversions and operators

Besides XDocument, XElement, XAttribute, and XComment in above example, some other XML structures can also can declaratively constructed too:

```xml
internal static void Construction()
{
    XDeclaration declaration = new XDeclaration("1.0", null, "no");
    declaration.WriteLine(); // <?xml version="1.0" standalone="no"?>

    XDocumentType documentType = new XDocumentType("html", null, null, null);
    documentType.WriteLine(); // <!DOCTYPE html >

    XText text = new XText("<p>text</p>");
    text.WriteLine(); // &lt;p&gt;text&lt;/p&gt;

    XCData cData = new XCData("cdata");
    cData.WriteLine(); // <![CDATA[cdata]]>

    XProcessingInstruction processingInstruction = new XProcessingInstruction(
        "xml-stylesheet", @"type=""text/xsl"" href=""Style.xsl""");
    processingInstruction.WriteLine(); // <?xml-stylesheet type="text/xsl" href="Style.xsl"?>
}
```

XName is different. LINQ to XML provides 2 equivalent ways to instantiate XName:

-   calling XName.Get
-   implicitly converting from string (which is implemented with XName.Get as well).

The constructor is not exposed, because LINQ to XML caches all the constructed XName instances at runtime, so a XName instance is constructed only once for a specific name. LINQ to XML also implements the == and != operator by checking the reference equality:

```csharp
internal static void Name()
{
    XName attributeName1 = "isPermaLink"; // Implicitly convert string to XName.
    XName attributeName2 = XName.Get("isPermaLink");
    XName attributeName3 = "IsPermaLink";
    object.ReferenceEquals(attributeName1, attributeName2).WriteLine(); // True
    (attributeName1 == attributeName2).WriteLine(); // True
    (attributeName1 != attributeName3).WriteLine(); // True
}
```

XNamespace has the same behavior as XName. additionally, it implements the + operator to combine the namespace and local name:

```csharp
internal static void Namespace()
{
    XNamespace namespace1 = "http://www.w3.org/XML/1998/namespace"; // Implicitly convert string to XNamespace.
    XNamespace namespace2 = XNamespace.Xml;
    XNamespace namespace3 = XNamespace.Get("http://www.w3.org/2000/xmlns/");
    (namespace1 == namespace2).WriteLine(); // True
    (namespace1 != namespace3).WriteLine(); // True

    XNamespace @namespace = "https://weblogs.asp.net/dixin";
    XName name = @namespace + "localName"; // + operator.
    name.WriteLine(); // {https://weblogs.asp.net/dixin}localName
    XElement element = new XElement(name, new XAttribute(XNamespace.Xmlns + "dixin", @namespace)); // + operator.
    element.WriteLine(); // <dixin:localName xmlns:dixin="https://weblogs.asp.net/dixin" />
}
```

XElement can be explicitly converted to .NET primitive types, e.g.:

```csharp
internal static void Element()
{
    XElement pubDateElement = XElement.Parse("<pubDate>Mon, 07 Sep 2009 00:00:00 GMT</pubDate>");
    DateTime pubDate = (DateTime)pubDateElement;
    pubDate.WriteLine(); // 9/7/2009 12:00:00 AM
}
```

The above conversion is implemented by calling DateTime.Parse with the string value returned by XElement.Value.

XAttribute can be converted to primitive types too:

```csharp
internal static void Attribute()
{
    XName name = "isPermaLink";
    XAttribute isPermaLinkAttribute = new XAttribute(name, "true");
    bool isPermaLink = (bool)isPermaLinkAttribute;
    isPermaLink.WriteLine() // True
}
```

Here the conversion is implemented by calling System.Xml.XmlConvert’s ToBoolean method with the string value returned by XElement.Value.

XComment, XDocument, XElement, XDocumentType, XProcessingInstruction, XText, and XCData types inherit XNode. XNode provides a DeepEquals method to compare any 2 nodes:

```csharp
internal static void DeepEquals()
{
    XElement element1 = XElement.Parse("<parent><child></child></parent>");
    XElement element2 = new XElement("parent", new XElement("child")); // <parent><child /></parent>
    object.ReferenceEquals(element1, element2).WriteLine(); // False
    XNode.DeepEquals(element1, element2).WriteLine(); // True

    XElement element3 = new XElement("parent", new XElement("child", string.Empty)); // <parent><child></child></parent>
    object.ReferenceEquals(element1, element2).WriteLine(); // False
    XNode.DeepEquals(element1, element3).WriteLine(); // False
}
```

Here element2’s child element is constructed with null content, so it is a empty element node <child /> (where XElement.IsEmpty returns true). element3’s child element is constructed with an empty string as content, so it is a non-empty element <child></child> ((where XElement.IsEmpty returns false). As a result, element1 has the same node structures and node values as element2, and they are different from element3.

## Read and deserialize XML

In LINQ to XML, XML can be easily read or deserialized to XNode/XElement/XDocument instances in memory. with the following APIs:

-   XmlReader (under System.Xml namespace)
-   XNode.CreateReader, XNode.ReadFrom
-   XDocument.Load, XDocument.Parse
-   XElement.Load, XElement.Parse

The APIs accepting URI, for example:

```xml
internal static void Read()
{
    using (XmlReader reader = XmlReader.Create("https://weblogs.asp.net/dixin/rss"))
    {
        reader.MoveToContent();
        XNode node = XNode.ReadFrom(reader);
    }

    XElement element1 = XElement.Parse("<html><head></head><body></body></html>");
    XElement element2 = XElement.Load("https://weblogs.asp.net/dixin/rss");

    XDocument document1 = XDocument.Parse("<html><head></head><body></body></html>");
    XDocument document2 = XDocument.Load("https://microsoft.com"); // Succeed.
    XDocument document3 = XDocument.Load("https://asp.net"); // Fail.
    // System.Xml.XmlException: The 'ul' start tag on line 68 position 116 does not match the end tag of 'div'. Line 154, position 109.
}
```

Reading an RSS feed to construct an XML tree usually work smoothly, since RSS is just XML. Reading a web page usually has bigger chance to fail, because in the real world, a HTML document may be not strictly structured.

The above example reads entire XML document and deserialize the string to XML tree in the memory. Regarding the specified XML can have arbitrary size, XmlReader and XNode.ReadFrom can also read XML fragment by fragment:

```csharp
internal static IEnumerable<XElement> RssItems(string rssUri)
{
    using (XmlReader reader = XmlReader.Create(rssUri))
    {
        reader.MoveToContent();
        while (reader.Read())
        {
            if (reader.NodeType == XmlNodeType.Element && reader.Name.Equals("item", StringComparison.Ordinal))
            {
                yield return (XElement)XNode.ReadFrom(reader);
            }
        }
    }
}
```

As discussed in the LINQ to Objects chapter, method with yield return statement is compiled to generator creation, and all the API calls in above method body is deferred, so each <item> in the RSS feed is read and deserialized on demand.

## Serialize and write XML

The following APIs are provided to serialize XML to string, or write XML to somewhere (file system, memory, etc.):

-   XmlWriter
-   XObject.ToString
-   XNode.ToString, XNode.WriteTo
-   XContainer.CreateWriter
-   XDocument.Save
-   XElement.Save
-   XStramingElement.Save, XStramingElement.ToString, XStreamingElement.WriteTo

For example:

```csharp
internal static void Write()
{
    XDocument document1 = XDocument.Load("https://weblogs.asp.net/dixin/rss");
    using (FileStream stream = File.OpenWrite(Path.GetTempFileName()))
    {
        document1.Save(stream);
    }

    XElement element1 = new XElement("element", string.Empty);
    XDocument document2 = new XDocument();
    using (XmlWriter writer = document2.CreateWriter())
    {
        element1.WriteTo(writer);
    }
    document2.WriteLine(); // <element></element>

    XElement element2 = new XElement("element", string.Empty);
    using (XmlWriter writer = element2.CreateWriter())
    {
        writer.WriteStartElement("child");
        writer.WriteAttributeString("attribute", "value");
        writer.WriteString("text");
        writer.WriteEndElement();
    }
    element2.ToString(SaveOptions.DisableFormatting).WriteLine();
    // <element><child attribute="value">text</child></element>
}
```

XNode also provides a ToString overload to accept a SaveOptions flag:

```csharp
internal static void XNodeToString()
{
    XDocument document = XDocument.Parse(
        "<root xmlns:prefix='namespace'><element xmlns:prefix='namespace' /></root>");
    document.ToString(SaveOptions.None).WriteLine(); // Equivalent to document.ToString().
    // <root xmlns:prefix="namespace">
    //  <element xmlns:prefix="namespace" />
    // </root>
    document.ToString(SaveOptions.DisableFormatting).WriteLine();
    // <root xmlns:prefix="namespace"><element xmlns:prefix="namespace" /></root>
    document.ToString(SaveOptions.OmitDuplicateNamespaces).WriteLine();
    // <root xmlns:prefix="namespace">
    //  <element />
    // </root>
}
```

To serialize XML with even more custom settings, the XmlWriter with XmlWriterSettings approach in the DOM API example can be used.

## Deferred construction

The XStreamingElement is a special type. It is used to defer the build of element. For example:

```csharp
internal static void StreamingElementWithChildElements()
{
    IEnumerable<XElement> ChildElementsFactory() =>
        Enumerable
            .Range(0, 5).Do(value => value.WriteLine())
            .Select(value => new XElement("child", value));

    XElement immediateParent = new XElement("parent", ChildElementsFactory()); // 0 1 2 3 4.
    immediateParent.ToString(SaveOptions.DisableFormatting).WriteLine();
    // <parent><child>0</child><child>1</child><child>2</child><child>3</child><child>4</child></parent>

    XStreamingElement deferredParent = new XStreamingElement("parent", ChildElementsFactory()); // Deferred.
    deferredParent.ToString(SaveOptions.DisableFormatting).WriteLine();
    // 0 1 2 3 4 
    // <parent><child>0</child><child>1</child><child>2</child><child>3</child><child>4</child></parent>
}
```

Here a factory function is defined to generate a sequence of child elements. It calls the Do query method from Interactive Extension (Ix) to prints each value when that pulled from the sequence. Next, the XElement constructor is called, which immediately pulls all child elements from the sequence returned by the factory function, so that the parent element is immediately built with those child elements. Therefore, the Do query is executed right away, and prints the values of the generated child elements. In contrast, XStreamingElement constructor does not pull the child elements from the sequence, the values are not printed yet by Do. The pulling is deferred until the parent element needs to be built, for example, when XStreamingElement.Save/XStreamingElement.ToString/XStreamingElement.WriteTo is called.

This feature can also be demonstrated by modifying the child elements. For XElement, once constructed, the element is built immediately, and is not impacted by modifying the original child elements In contrast, .XStreamingElement can be impacted by the modification:

```csharp
internal static void StreamingElementWithChildElementModification()
{
    XElement source = new XElement("source", new XElement("child", "a"));
    XElement child = source.Elements().Single();

    XElement immediateParent = new XElement("parent", child);
    XStreamingElement deferredParent = new XStreamingElement("parent", child); // Deferred.

    child.Value = "b";
    immediateParent.ToString(SaveOptions.DisableFormatting).WriteLine(); // <parent><child>a</child></parent>
    deferredParent.ToString(SaveOptions.DisableFormatting).WriteLine(); // <parent><child>b</child></parent>
}
```