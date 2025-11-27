---
title: "LINQ to XML in Depth (1) Modeling XML"
published: 2019-08-10
description: "XML (eXtensible Markup Language) is widely used to represent, store, and transfer data. .NET Standard provides LINQ to XML APIs to query XML data source. LINQ to XML APIs are located in System.Xml.XDo"
image: ""
tags: [".NET", "C#", "LINQ", "LINQ to XML", "XML"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[LINQ to XML in Depth series](/archive/?tag=LINQ%20to%20XML)\]

XML (eXtensible Markup Language) is widely used to represent, store, and transfer data. .NET Standard provides LINQ to XML APIs to query XML data source. LINQ to XML APIs are located in System.Xml.XDocument NuGet package for .NET Core, and System.Xml.Linq.dll assembly for .NET Framework. LINQ to XML can be viewed as specialized LINQ to Objects, where the queried objects represent XML structures.

## Modeling XML

.NET Standard provides a set provides types to represent the XML structures, including XML document, namespace, element, attribute, comment, text, etc., so that XML can be loaded to memory as instances of those types, and then be queried with LINQ as objects.

### Imperative paradigm vs. declarative paradigm

The XML DOM APIs are provided since .NET Framework 1.0. There a set of Xml\* types in System.Xml namespace representing XML structures. The following list shows their inheritance hierarchy:

· XmlNamedNodeMap

o XmlAttributeCollection

· XmlNode

o XmlAttribute

o XmlDocument

o XmlDocumentFragment

o XmlEntity

o XmlLinkedNode

§ XmlCharacterData

§ XmlCDataSection

§ XmlComment

§ XmlSignificantWhitespace

§ XmlText

§ XmlWhitespace

§ XmlDeclaration

§ XmlDocumentType

§ XmlElement

§ XmlEntityReference

§ XmlProcessingInstruction

o XmlNotation

· XmlNodeList

· XmlQualifiedName

These DOM APIs for XML can be used to model and manipulate XML structures in imperative paradigm. Take the following XML fragment as example:

<rss version\="2.0" xmlns:dixin\="https://weblogs.asp.net/dixin"\>

```csharp
<channel>
```
```csharp
<item>
```
```csharp
<title>LINQ via C#</title>
```
```csharp
<link>https://weblogs.asp.net/dixin/linq-via-csharp</link>
```
```csharp
<description>
```
```csharp
<p>This is a tutorial of LINQ and functional programming. Hope it helps.</p>
```
```csharp
</description>
```
```csharp
<pubDate>Mon, 07 Sep 2009 00:00:00 GMT</pubDate>
```
```csharp
<guid isPermaLink="true">https://weblogs.asp.net/dixin/linq-via-csharp</guid>
```
```csharp
<category>C#</category>
```
```csharp
<category>LINQ</category>
```
```csharp
<!--Comment.-->
```
```csharp
<dixin:source>https://github.com/Dixin/CodeSnippets/tree/master/Dixin/Linq</dixin:source>
```
```csharp
</item>
```
```csharp
</channel>
```

</rss\>

It is a small RSS feed sample with one single item. The following example calls XML DOM APIs to build such a XML tree, and serialize the XML tree to string:

internal static void CreateAndSerializeWithDom()

```csharp
{
```
```csharp
XmlNamespaceManager namespaceManager = new XmlNamespaceManager(new NameTable());
```
```csharp
const string NamespacePrefix = "dixin";
```
```csharp
namespaceManager.AddNamespace(NamespacePrefix, "https://weblogs.asp.net/dixin");
```

```csharp
XmlDocument document = new XmlDocument(namespaceManager.NameTable);
```

```csharp
XmlElement rss = document.CreateElement("rss");
```
```csharp
rss.SetAttribute("version", "2.0");
```
```csharp
XmlAttribute attribute = document.CreateAttribute(
```
```csharp
"xmlns", NamespacePrefix, namespaceManager.LookupNamespace("xmlns"));
```
```csharp
attribute.Value = namespaceManager.LookupNamespace(NamespacePrefix);
```
```csharp
rss.SetAttributeNode(attribute);
```
```csharp
document.AppendChild(rss);
```

```csharp
XmlElement channel = document.CreateElement("channel");
```
```csharp
rss.AppendChild(channel);
```

```csharp
XmlElement item = document.CreateElement("item");
```
```csharp
channel.AppendChild(item);
```

```csharp
XmlElement title = document.CreateElement("title");
```
```csharp
title.InnerText = "LINQ via C#";
```
```csharp
item.AppendChild(title);
```

```csharp
XmlElement link = document.CreateElement("link");
```
```csharp
link.InnerText = "https://weblogs.asp.net/dixin/linq-via-csharp";
```
```csharp
item.AppendChild(link);
```

```csharp
XmlElement description = document.CreateElement("description");
```
```csharp
description.InnerXml = "<p>This is a tutorial of LINQ and functional programming. Hope it helps.</p>";
```
```csharp
item.AppendChild(description);
```

```csharp
XmlElement pubDate = document.CreateElement("pubDate");
```
```csharp
pubDate.InnerText = new DateTime(2009, 9, 7).ToString("r");
```
```csharp
item.AppendChild(pubDate);
```

```csharp
XmlElement guid = document.CreateElement("guid");
```
```csharp
guid.InnerText = "https://weblogs.asp.net/dixin/linq-via-csharp";
```
```csharp
guid.SetAttribute("isPermaLink", "true");
```
```csharp
item.AppendChild(guid);
```

```csharp
XmlElement category1 = document.CreateElement("category");
```
```csharp
category1.InnerText = "C#";
```
```csharp
item.AppendChild(category1);
```

```csharp
XmlNode category2 = category1.CloneNode(false);
```
```csharp
category2.InnerText = "LINQ";
```
```csharp
item.AppendChild(category2);
```

```csharp
XmlComment comment = document.CreateComment("Comment.");
```
```csharp
item.AppendChild(comment);
```

```csharp
XmlElement source = document.CreateElement(NamespacePrefix, "source", namespaceManager.LookupNamespace(NamespacePrefix));
```
```csharp
source.InnerText = "https://github.com/Dixin/CodeSnippets/tree/master/Dixin/Linq";
```
```csharp
item.AppendChild(source);
```

```csharp
// Serialize XmlDocument to string.
```
```csharp
// rssItem.ToString() outputs "System.Xml.XmlElement".
```
```csharp
// rssItem.OuterXml outputs a single line of XML text.
```
```csharp
StringBuilder xmlString = new StringBuilder();
```
```csharp
XmlWriterSettings settings = new XmlWriterSettings
```
```csharp
{
```
```csharp
Indent = true,
```
```csharp
IndentChars = " ",
```
```csharp
OmitXmlDeclaration = true
```
```csharp
};
```
```csharp
using (XmlWriter writer = XmlWriter.Create(xmlString, settings))
```
```csharp
{
```
```csharp
document.Save(writer);
```
```csharp
}
```

```csharp
xmlString.WriteLine();
```

}

These APIs have a few disadvantages:

· Any XML structure has to be created with a XmlDocument instance.

· XML tree has to be built imperatively, node by node.

· Additional work is needed to manage namespaces and prefixes.

· Some operations, like serialization, is not straightforward.

Fortunately, LINQ to XML does not work with these Xml\* types. It redesigns a bunch of X\* types under System.Xml.Linq namespace, and enables LINQ queries for these objects. The following list shows the inheritance hierarchy of all the X\* types, as well as each type’s conversion from/to other types, and their overloaded operators:

· XDeclaration

· XName: implicit convertible from string, ==, !=

· XNamespace: implicit convertible from string, + string, ==, !=

· XObject

o XAttribute: explicit convertible to string/bool/bool?/int/int?/uint/uint?/long/long?/ulong/ulong?/float/float?/double/double?/decimal/decimal?/DateTime/DateTime?/TimeSpan/TimeSpan?/Guid/Guid?

o XNode: DeepEquals

§ XComment

§ XContainer

§ XDocument

§ XElement: explicit convertible to string/bool/bool?/int/int?/uint/uint?/long/long?/ulong/ulong?/float/float?/double/double?/decimal/decimal?/DateTime/DateTime?/TimeSpan/TimeSpan?/Guid/Guid?

§ XDocumentType

§ XProcessingInstruction

§ XText

§ XCData

· XStreamingElement

As the names suggest, e.g., XNode represents a XML node, XDocument represents a XML document, XName represents XML element name or XML attribute name, etc. And apparently, An XML element/attribute name is essentially a string, so XName implements implicit conversion from string, which provides great convenience. The following example builds the same XML tree with the new LINQ to XML types:

internal static void CreateAndSerializeWithLinq()

```csharp
{
```
```csharp
XNamespace @namespace = "https://weblogs.asp.net/dixin";
```
```csharp
XElement rss = new XElement(
```
```csharp
"rss",
```
```csharp
new XAttribute("version", "2.0"),
```
```csharp
new XAttribute(XNamespace.Xmlns + "dixin", @namespace),
```
```csharp
new XElement(
```
```csharp
"channel",
```
```csharp
new XElement(
```
```csharp
"item", // Implicitly converted to XName.
```
```csharp
new XElement("title", "LINQ via C#"),
```
```csharp
new XElement("link", "https://weblogs.asp.net/dixin/linq-via-csharp"),
```
```csharp
new XElement(
```
```csharp
"description",
```
```csharp
XElement.Parse("<p>This is a tutorial of LINQ and functional programming. Hope it helps.</p>")),
```
```csharp
new XElement("pubDate", new DateTime(2009, 9, 7).ToString("r")),
```
```csharp
new XElement(
```
```csharp
"guid",
```
```csharp
new XAttribute("isPermaLink", "true"), // "isPermaLink" is implicitly converted to XName.
```
```csharp
"https://weblogs.asp.net/dixin/linq-via-csharp"),
```
```csharp
new XElement("category", "C#"),
```
```csharp
new XElement("category", "LINQ"),
```
```csharp
new XComment("Comment."),
```
```csharp
new XElement(
```
```csharp
@namespace + "source",
```
```csharp
"https://github.com/Dixin/CodeSnippets/tree/master/Dixin/Linq"))));
```
```csharp
rss.ToString().WriteLine(); // Serialize XDocument to string.
```

}

The new APIs is shorter and more intuitive:

· XML structure can be created on the fly, XDocument is not involved in the entire example.

· XML tree can be built declaratively.

· Easier namespace management, with prefix automatically taken care of.

· To serialize an XML tree, simply call ToString.

### Types, conversions and operators

Besides XDocument, XElement, XAttribute, and XComment in above example, some other XML structures can also can declaratively constructed too:

internal static void Construction()

```csharp
{
```
```csharp
XDeclaration declaration = new XDeclaration("1.0", null, "no");
```
```xml
declaration.WriteLine(); // <?xml version="1.0" standalone="no"?>
```

```csharp
XDocumentType documentType = new XDocumentType("html", null, null, null);
```
```csharp
documentType.WriteLine(); // <!DOCTYPE html>
```

```csharp
XText text = new XText("<p>text</p>");
```
```csharp
text.WriteLine(); // & lt;p&gt;text&lt;/p&gt;
```

```csharp
XCData cData = new XCData("cdata");
```
```csharp
cData.WriteLine(); // <![CDATA[cdata]]>
```

```csharp
XProcessingInstruction processingInstruction = new XProcessingInstruction(
```
```csharp
"xml-stylesheet", @"type=""text/xsl"" href=""Style.xsl""");
```
```csharp
processingInstruction.WriteLine(); //< ?xml-stylesheet type="text/xsl" href="Style.xsl"?>
```

}

XName is different. LINQ to XML provides 2 equivalent ways to instantiate XName:

· calling XName.Get

· implicitly converting from string (which is implemented with XName.Get as well).

The constructor is not exposed, because LINQ to XML caches all the constructed XName instances at runtime, so a XName instance is constructed only once for a specific name. LINQ to XML also implements the == and != operator by checking the reference equality:

internal static void Name()

```csharp
{
```
```csharp
XName attributeName1 = "isPermaLink"; // Implicitly convert string to XName.
```
```csharp
XName attributeName2 = XName.Get("isPermaLink");
```
```csharp
XName attributeName3 = "IsPermaLink";
```
```csharp
object.ReferenceEquals(attributeName1, attributeName2).WriteLine(); // True
```
```csharp
(attributeName1 == attributeName2).WriteLine(); // True
```
```csharp
(attributeName1 != attributeName3).WriteLine(); // True
```

}

XNamespace has the same behaviour as XName. additionally, it implements the + operator to combine the namespace and local name:

internal static void Namespace()

```csharp
{
```
```csharp
XNamespace namespace1 = "http://www.w3.org/XML/1998/namespace"; // Implicitly convert string to XNamespace.
```
```csharp
XNamespace namespace2 = XNamespace.Xml;
```
```csharp
XNamespace namespace3 = XNamespace.Get("http://www.w3.org/2000/xmlns/");
```
```csharp
(namespace1 == namespace2).WriteLine(); // True
```
```csharp
(namespace1 != namespace3).WriteLine(); // True
```

```csharp
XNamespace @namespace = "https://weblogs.asp.net/dixin";
```
```csharp
XName name = @namespace + "localName"; // + operator.
```
```csharp
name.WriteLine(); // {https://weblogs.asp.net/dixin}localName
```
```csharp
XElement element = new XElement(name, new XAttribute(XNamespace.Xmlns + "dixin", @namespace)); // + operator.
```
```csharp
element.WriteLine(); // <dixin:localName xmlns:dixin="https://weblogs.asp.net/dixin" />
```

}

XElement can be explicitly converted to .NET primitive types, e.g.:

internal static void Element()

```csharp
{
```
```csharp
XElement pubDateElement = XElement.Parse("<pubDate>Mon, 07 Sep 2009 00:00:00 GMT</pubDate>");
```
```csharp
DateTime pubDate = (DateTime)pubDateElement;
```
```csharp
pubDate.WriteLine(); // 9/7/2009 12:00:00 AM
```

}

The above conversion is implemented by calling DateTime.Parse with the string value returned by XElement.Value.

XAttribute can be converted to primitive types too:

internal static void Attribute()

```csharp
{
```
```csharp
XName name = "isPermaLink";
```
```csharp
XAttribute isPermanentLinkAttribute = new XAttribute(name, "true");
```
```csharp
bool isPermaLink = (bool)isPermanentLinkAttribute;
```
```csharp
isPermanentLink.WriteLine() // True
```

}

Here the conversion is implemented by calling System.Xml.XmlConvert’s ToBoolean method with the string value returned by XElement.Value.

XComment, XDocument, XElement, XDocumentType, XProcessingInstruction, XText, and XCData types inherit XNode. XNode provides a DeepEquals method to compare any 2 nodes:

internal static void DeepEquals()

```csharp
{
```
```csharp
XElement element1 = XElement.Parse("<parent><child></child></parent>");
```
```csharp
XElement element2 = new XElement("parent", new XElement("child")); // < parent><child /></parent>
```
```csharp
object.ReferenceEquals(element1, element2).WriteLine(); // False
```
```csharp
XNode.DeepEquals(element1, element2).WriteLine(); // True
```

```csharp
XElement element3 = new XElement("parent", new XElement("child", string.Empty)); // < parent><child></child></parent>
```
```csharp
object.ReferenceEquals(element1, element2).WriteLine(); // False
```
```csharp
XNode.DeepEquals(element1, element3).WriteLine(); // False
```

}

Here element2’s child element is constructed with null content, so it is an empty element node <child /> (where XElement.IsEmpty returns true). element3’s child element is constructed with an empty string as content, so it is a non-empty element< child></child> ((where XElement.IsEmpty returns false). As a result, element1 has the same node structures and node values as element2, and they are different from element3.

### Read and deserialize XML

In LINQ to XML, XML can be easily read or deserialized to XNode/XElement/XDocument instances in memory. with the following APIs:

· XmlReader (under System.Xml namespace)

· XNode.CreateReader, XNode.ReadFrom

· XDocument.Load, XDocument.Parse

· XElement.Load, XElement.Parse

The APIs accepting URI, for example:

internal static void Read()

```csharp
{
```
```csharp
using (XmlReader reader = XmlReader.Create("https://weblogs.asp.net/dixin/rss"))
```
```csharp
{
```
```csharp
reader.MoveToContent();
```
```csharp
XNode node = XNode.ReadFrom(reader);
```
```csharp
}
```

```xml
XElement element1 = XElement.Parse("<html><head></head><body></body></html>");
```
```csharp
XElement element2 = XElement.Load("https://weblogs.asp.net/dixin/rss");
```

```xml
XDocument document1 = XDocument.Parse("<html><head></head><body></body></html>");
```
```csharp
XDocument document2 = XDocument.Load("https://microsoft.com"); // Succeed.
```
```csharp
XDocument document3 = XDocument.Load("https://asp.net"); // Fail.
```
```csharp
// System.Xml.XmlException: The 'ul' start tag on line 68 position 116 does not match the end tag of 'div'. Line 154, position 109.
```

}

Reading an RSS feed to construct an XML tree usually work smoothly, since RSS is just XML. Reading a web page usually has bigger chance to fail, because in the real world, a HTML document may be not strictly structured.

The above example reads entire XML document and deserialize the string to XML tree in the memory. Regarding the specified XML can have arbitrary size, XmlReader and XNode.ReadFrom can also read XML fragment by fragment:

internal static IEnumerable<XElement\> RssItems(string rssUri)

```csharp
{
```
```csharp
using (XmlReader reader = XmlReader.Create(rssUri))
```
```csharp
{
```
```csharp
reader.MoveToContent();
```
```csharp
while (reader.Read())
```
```csharp
{
```
```csharp
if (reader.NodeType == XmlNodeType.Element && reader.Name.Equals("item", StringComparison.Ordinal))
```
```csharp
{
```
```csharp
yield return (XElement)XNode.ReadFrom(reader);
```
```csharp
}
```
```csharp
}
```
```csharp
}
```

}

As discussed in the LINQ to Objects chapter, function with yield return statement is compiled to generator construction, and all the API calls in above function body is deferred, so each <item> in the RSS feed is read and deserialized on demand.

### Serialize and write XML

The following APIs are provided to serialize XML to string, or write XML to somewhere (file system, memory, etc.):

· XmlWriter

· XObject.ToString

· XNode.ToString, XNode.WriteTo

· XContainer.CreateWriter

· XDocument.Save

· XElement.Save

· XStramingElement.Save, XStramingElement.ToString, XStreamingElement.WriteTo

For example:

internal static void Write()

```csharp
{
```
```csharp
XDocument document1 = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```csharp
using (FileStream stream = File.OpenWrite(Path.GetTempFileName()))
```
```csharp
{
```
```csharp
document1.Save(stream);
```
```csharp
}
```

```csharp
XElement element1 = new XElement("element", string.Empty);
```
```csharp
XDocument document2 = new XDocument();
```
```csharp
using (XmlWriter writer = document2.CreateWriter())
```
```csharp
{
```
```csharp
element1.WriteTo(writer);
```
```csharp
}
```
```csharp
document2.WriteLine(); //< element></element>
```

```csharp
XElement element2 = new XElement("element", string.Empty);
```
```csharp
using (XmlWriter writer = element2.CreateWriter())
```
```csharp
{
```
```csharp
writer.WriteStartElement("child");
```
```csharp
writer.WriteAttributeString("attribute", "value");
```
```csharp
writer.WriteString("text");
```
```csharp
writer.WriteEndElement();
```
```csharp
}
```
```csharp
element2.ToString(SaveOptions.DisableFormatting).WriteLine();
```
```csharp
// <element><child attribute="value">text</child></element>
```

}

XNode also provides a ToString overload to accept a SaveOptions flag:

internal static void XNodeToString()

```csharp
{
```
```csharp
XDocument document = XDocument.Parse(
```
```csharp
"<root xmlns:prefix='namespace'><element xmlns:prefix='namespace' /></root>");
```
```csharp
document.ToString(SaveOptions.None).WriteLine(); // Equivalent to document.ToString().
```
```csharp
// <root xmlns:prefix="namespace">
```
```csharp
// <element xmlns:prefix="namespace" />
```
```csharp
// </root>
```
```csharp
document.ToString(SaveOptions.DisableFormatting).WriteLine();
```
```csharp
// <root xmlns:prefix="namespace"><element xmlns:prefix="namespace" /></root>
```
```csharp
document.ToString(SaveOptions.OmitDuplicateNamespaces).WriteLine();
```
```csharp
// <root xmlns:prefix="namespace">
```
```csharp
// <element />
```
```csharp
// </root>
```

}

To serialize XML with even more custom settings, the XmlWriter with XmlWriterSettings approach in the DOM API example can be used.

### Deferred construction

The XStreamingElement is a special type. It is used to defer the build of element. For example:

internal static void StreamingElementWithChildElements()

```csharp
{
```
```csharp
IEnumerable<XElement> ChildElementsFactory() =>
```
```csharp
Enumerable
```
```csharp
.Range(0, 5).Do(value => value.WriteLine())
```
```csharp
.Select(value => new XElement("child", value));
```

```csharp
XElement immediateParent = new XElement("parent", ChildElementsFactory()); // 0 1 2 3 4.
```
```csharp
immediateParent.ToString(SaveOptions.DisableFormatting).WriteLine();
```
```csharp
// < parent><child>0</child><child>1</child><child>2</child><child>3</child><child>4</child></parent>
```

```csharp
XStreamingElement deferredParent = new XStreamingElement("parent", ChildElementsFactory()); // Deferred.
```
```csharp
deferredParent.ToString(SaveOptions.DisableFormatting).WriteLine();
```
```csharp
// 0 1 2 3 4
```
```csharp
// < parent><child>0</child><child>1</child><child>2</child><child>3</child><child>4</child></parent>
```

}

Here a factory function is defined to generate a sequence of child elements. It calls the Do query from Interactive Extension (Ix) to prints each value when that pulled from the sequence. Next, the XElement constructor is called, which immediately pulls all child elements from the sequence returned by the factory function, so that the parent element is immediately built with those child elements. Therefore, the Do query is executed right away, and prints the values of the generated child elements. In contrast, XStreamingElement constructor does not pull the child elements from the sequence, the values are not printed yet by Do. The pulling is deferred until the parent element needs to be built, for example, when XStreamingElement.Save/XStreamingElement.ToString/XStreamingElement.WriteTo is called.

This feature can also be demonstrated by modifying the child elements. For XElement, once constructed, the element is built immediately, and is not impacted by modifying the original child elements. In contrast, XStreamingElement can be impacted by the modification:

internal static void StreamingElementWithChildElementModification()

```csharp
{
```
```csharp
XElement source = new XElement("source", new XElement("child", "a"));
```
```csharp
XElement child = source.Elements().Single();
```

```csharp
XElement immediateParent = new XElement("parent", child);
```
```csharp
XStreamingElement deferredParent = new XStreamingElement("parent", child); // Deferred.
```

```csharp
child.Value = "b";
```
```csharp
immediateParent.ToString(SaveOptions.DisableFormatting).WriteLine(); // < parent><child>a</child></parent>
```
```csharp
deferredParent.ToString(SaveOptions.DisableFormatting).WriteLine(); // < parent><child>b</child></parent>
```

}