---
title: "LINQ to XML in Depth (3) Manipulating XML"
published: 2019-08-27
description: "Besides creating and querying XML, LINQ to XML also provides APIs for other XML manipulations, including cloning, deleting, replacing, and updating XML structures:"
image: ""
tags: [".NET", "C#", "LINQ", "LINQ to XML", "LINQ via C#", "XML"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[LINQ to XML in Depth series](/archive/?tag=LINQ%20to%20XML)\]

Besides creating and querying XML, LINQ to XML also provides APIs for other XML manipulations, including cloning, deleting, replacing, and updating XML structures:

· Clone

o Explicit Clone: constructors of XAttribute, XCData, XComment, XDeclaration, XDocument, XElement, XProcessingInstruction, XText

· Add

o Add annotations: XObject.AddAnnotation

o Add children: XContainer.Add, XContainer.AddFirst, XStreamingElement.Add

o Add siblings: XNode.AddAfterSelf, XNode.AddBeforeSelf

· Delete

o Delete annotations: XObject.RemoveAnnotations

o Delete attributes: XElement.RemoveAttributes, XAttribute.Remove

o Delete self: XNode.Remove

o Delete children: XContainer.RemoveNodes, XElement.RemoveAll

· Replace

o Replace attributes: XElement.ReplaceAttributes

o Replace self: XNode.ReplaceWith

o Replace children: XContainer.ReplaceNodes, XElement.ReplaceAll

· Update

o Update attribute: XAttribute.Value

o Update comment: XComment.Value

o Update declaration: XDeclaration.Encoding, XDeclaration.Standalone, XDeclaration.Version

o Update document: XDocument.XDeclaration, XDocumentType.InternalSubset, XDocumentType.Name, XDocumentType.PublicId, XDocumentType.SystemId

o Update element: XElement.Name, XElement.Value, XElement.SetAttributeValue, XElement.SetElementValue, XElement.SetValue

.NET Framework also provides APIs for validating and transforming XML:

· Validate with XSD

o Query schema: XAttribute.GetSchemaInfo\*, XElement.GetSchemaInfo\*

o Validate schema: XAttribute.Validate\*, XDocument.Validate\*, XElement.Validate\*

· Transform with XSL: XslCompiledTransform.Transform

The APIs with \* are extension methods provided by System.Xml.Schema.Extensions.

### Clone

Most structures can be cloned by calling their constructors with the source instance:

internal static void ExplicitClone()

```csharp
{
```
```csharp
XElement sourceElement = XElement.Parse("<element />");
```
```csharp
XElement clonedElement = new XElement(sourceElement);
```

```csharp
XText sourceText = new XText("text");
```
```csharp
XText clonedText = new XText(sourceText);
```

```csharp
XDocument sourceDocument = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```csharp
XDocument clonedDocument = new XDocument(sourceDocument);
```
```csharp
object.ReferenceEquals(sourceDocument, clonedDocument).WriteLine(); // False
```
```csharp
object.Equals(sourceDocument, clonedDocument).WriteLine(); // False
```
```csharp
EqualityComparer<XDocument>.Default.Equals(sourceDocument, clonedDocument).WriteLine(); // False
```
```csharp
sourceDocument.Equals(clonedDocument).WriteLine(); // False
```
```csharp
(sourceDocument == clonedDocument).WriteLine(); // False
```
```csharp
XNode.DeepEquals(sourceDocument, clonedDocument).WriteLine(); // True
```
```csharp
XNode.EqualityComparer.Equals(sourceDocument, clonedDocument).WriteLine(); // True
```

}

If an XObject instance is in an XML tree, when it is added to a different XML tree, it is cloned, and the new instance is actually added to the target. The exceptions are XName and XNamespace, which are cached at runtime. For example:

internal static void ImplicitClone()

```csharp
{
```
```csharp
XElement child = XElement.Parse("<child />");
```
```csharp
XName parentName = "parent";
```
```csharp
XElement parent1 = new XElement(parentName, child); // Attach.
```
```csharp
object.ReferenceEquals(child, parent1.Elements().Single()).WriteLine(); // True
```
```csharp
object.ReferenceEquals(parentName, parent1.Name).WriteLine(); // True
```

```csharp
XElement parent2 = new XElement(parentName, child); // Clone and attach.
```
```csharp
object.ReferenceEquals(child, parent2.Elements().Single()).WriteLine(); // False
```
```csharp
object.ReferenceEquals(parentName, parent2.Name).WriteLine(); // True
```

```csharp
XElement element = new XElement("element");
```
```csharp
element.Add(element); // Clone and attach.
```
```csharp
object.ReferenceEquals(element, element.Elements().Single()).WriteLine(); // False
```

}

### Adding, deleting, replacing, updating, and events

Most of APIs to add/replace/delete/update XML structures are very intuitive. And when changing a XObject instance, XObject.Changing and XObject.Changed events are fired before and after the change. For example:

internal static void Manipulate()

```csharp
{
```
```csharp
XElement child = new XElement("child");
```
```csharp
child.Changing += (sender, e) =>
```
```csharp
$"Before {e.ObjectChange}: ({sender.GetType().Name} {sender}) => {child}".WriteLine();
```
```csharp
child.Changed += (sender, e) =>
```
```csharp
$"After {e.ObjectChange}: ({sender.GetType().Name} {sender}) => {child}".WriteLine();
```
```csharp
XElement parent = new XElement("parent");
```
```csharp
parent.Changing += (sender, e) =>
```
```csharp
$"Before {e.ObjectChange}: ({sender.GetType().Name} {sender}) => {parent.ToString(SaveOptions.DisableFormatting)}".WriteLine();
```
```csharp
parent.Changed += (sender, e) =>
```
```csharp
$"After {e.ObjectChange}: ({sender.GetType().Name} {sender}) => {parent.ToString(SaveOptions.DisableFormatting)}".WriteLine();
```

```csharp
child.Value = "value1";
```
```csharp
// Before Add: (XText value1) => <child />
```
```csharp
// After Add: (XText value1) =>< child>value1</child>
```

```csharp
child.Value = "value2";
```
```csharp
// Before Remove: (XText value1) =>< child>value1</child>
```
```csharp
// After Remove: (XText value1) =>< child />
```
```csharp
// Before Add: (XText value2) =>< child />
```
```csharp
// After Add: (XText value2) =>< child>value2</child>
```

```csharp
child.Value = string.Empty;
```
```csharp
// Before Remove: (XText value2) =>< child>value2</child>
```
```csharp
// After Remove: (XText value2) =>< child />
```
```csharp
// Before Value: (XElement <child />) => <child />
```
```csharp
// After Value: (XElement< child></child>) => <child></child>
```

```csharp
parent.Add(child);
```
```csharp
// Before Add: (XElement <child></child>) =>< parent />
```
```csharp
// After Add: (XElement< child></child>) => < parent><child></child></parent>
```

```csharp
child.Add(new XAttribute("attribute", "value"));
```
```csharp
// Before Add: (XAttribute attribute="value") => <child></child>
```
```csharp
// Before Add: (XAttribute attribute="value") => < parent><child></child></parent>
```
```csharp
// After Add: (XAttribute attribute="value") => <child attribute="value"></child>
```
```csharp
// After Add: (XAttribute attribute="value") => <parent><child attribute="value"></child></parent>
```

```csharp
child.AddBeforeSelf(0);
```
```csharp
// Before Add: (XText 0) => <parent><child attribute="value"></child></parent>
```
```csharp
// After Add: (XText 0) =>< parent>0<child attribute="value"></child></parent>
```

```csharp
parent.ReplaceAll(new XText("Text."));
```
```csharp
// Before Remove: (XText 0) => <parent>0<child attribute="value"></child></parent>
```
```csharp
// After Remove: (XText 0) =>< parent><child attribute="value"></child></parent>
```
```csharp
// Before Remove: (XElement <child attribute="value"></child>) => <parent><child attribute="value"></child></parent>
```
```csharp
// After Remove: (XElement <child attribute="value"></child>) => <parent />
```
```csharp
// Before Add: (XText Text.) =>< parent />
```
```csharp
// After Add: (XText Text.) =>< parent>Text.</parent>
```

```csharp
parent.Name = "name";
```
```csharp
// Before Name: (XElement< parent>Text.</parent>) => <parent>Text.</parent>
```
```csharp
// After Name: (XElement< name>Text.</name>) => <name>Text.</name>
```

```csharp
XElement clonedChild = new XElement(child);
```
```csharp
clonedChild.SetValue(DateTime.Now); // No tracing.
```

}

There are many APIs to manipulate XML, but there are only 4 kinds of Changing/Changed events: add object, deleting object, update object value, update element/attribute name. For example, as shown above, the APIs to replace objects are shortcuts of deleting old objects and adding new objects. When setting a string as an element’s value, the element first removes its children if there is any, then add the string as a child text node, if the string is not empty string. Also, an object’s events propagate/bubble up to the ancestors, and children and siblings are not impacted. When an object is cloned, the new object’s events is not observed by the original event handlers.

XElement.SetAttributeValue and XElement.SetElementValue are different from other APIs. They can

· add a new attribute/child element if it does not exist

· update the attribute/child element value if it exists:

· remove the attribute/child element if it exists and the provided value to null.

internal static void SetAttributeValue()

```csharp
{
```
```csharp
XElement element = new XElement("element");
```
```csharp
element.Changing += (sender, e) =>
```
```csharp
$"Before {e.ObjectChange}: ({sender.GetType().Name} {sender}) => {element}".WriteLine();
```
```csharp
element.Changed += (sender, e) =>
```
```csharp
$"After {e.ObjectChange}: ({sender.GetType().Name} {sender}) => {element}".WriteLine();
```

```csharp
element.SetAttributeValue("attribute", "value1"); // Equivalent to: child1.Add(new XAttribute("attribute", "value1"));
```
```csharp
// Before Add: (XAttribute attribute="value1") => <element />
```
```csharp
// After Add: (XAttribute attribute="value1") => <element attribute="value1" />
```

```csharp
element.SetAttributeValue("attribute", "value2"); // Equivalent to: child1.Attribute("attribute").Value = "value2";
```
```csharp
// Before Value: (XAttribute attribute="value1") => <element attribute="value1" />
```
```csharp
// After Value: (XAttribute attribute="value2") => <element attribute="value2" />
```

```csharp
element.SetAttributeValue("attribute", null);
```
```csharp
// Before Remove: (XAttribute attribute="value2") => <element attribute="value2" />
```
```csharp
// After Remove: (XAttribute attribute="value2") => <element />
```
```csharp
}
```

```csharp
internal static void SetElementValue()
```
```csharp
{
```
```csharp
XElement parent = new XElement("parent");
```
```csharp
parent.Changing += (sender, e) =>
```
```csharp
$"Before {e.ObjectChange}: {sender} => {parent.ToString(SaveOptions.DisableFormatting)}".WriteLine();
```
```csharp
parent.Changed += (sender, e) =>
```
```csharp
$"After {e.ObjectChange}: {sender} => {parent.ToString(SaveOptions.DisableFormatting)}".WriteLine();
```

```csharp
parent.SetElementValue("child", string.Empty); // Add child element.
```
```csharp
// Before Add: <child></child> => <parent />
```
```csharp
// After Add: <child></child> => <parent><child></child></parent>
```

```csharp
parent.SetElementValue("child", "value"); // Update child element.
```
```csharp
// Before Value:< child></child> => <parent><child></child></parent>
```
```csharp
// After Value: <child /> =>< parent><child /></parent>
```
```csharp
// Before Add: value =>< parent><child /></parent>
```
```csharp
// After Add: value => < parent><child>value</child></parent>
```

```csharp
parent.SetElementValue("child", null); // Remove child element.
```
```csharp
// Before Remove:< child>value</child> => < parent><child>value</child></parent>
```
```csharp
// After Remove: <child>value</child> => <parent />
```

}

### Annotation

Annotation is not a part of the XML. It is a separate arbitrary data in the memory, and associated with a XObject instance in the memory. The annotation APIs provided by XObject allows adding/querying/deleting any .NET data. Apparently, when cloning or serializing XObject, annotation is ignored on the new XObject and the generated string.

internal static void Annotation()

```csharp
{
```
```csharp
XElement element = new XElement("element");
```
```csharp
element.AddAnnotation(new Uri("https://microsoft.com"));
```

```csharp
Uri annotation = element.Annotation<Uri>();
```
```csharp
annotation.WriteLine(); // https://microsoft.com
```
```csharp
element.WriteLine(); // <element />
```

```csharp
XElement clone = new XElement(element); // element is cloned.
```
```csharp
clone.Annotations<Uri>().Any().WriteLine(); // False
```

```csharp
element.RemoveAnnotations<Uri>();
```
```csharp
(element.Annotation<Uri>() == null).WriteLine(); // True
```

}

### Validating XML with XSD

XSD (XML Schema Definition) is the metadata of XML tree, including XML's elements, attributes, constrains rules, etc. System.Xml.Schema.Extensions provides a few APIs to validate XML with provided schema. To obtain a schema, one option is to infer it from existing XML:

public static XmlSchemaSet InferSchema(this XNode source)

```csharp
{
```
```csharp
XmlSchemaInference schemaInference = new XmlSchemaInference();
```
```csharp
using (XmlReader reader = source.CreateReader())
```
```csharp
{
```
```csharp
return schemaInference.InferSchema(reader);
```
```csharp
}
```

}

The returned XmlSchemaSet instance contains s sequence of XmlSchema instances, one for each namespace in the source XML. XmlSchema can be converted to XDocument with the help of XmlWriter:

public static XDocument ToXDocument(this XmlSchema source)

```csharp
{
```
```csharp
XDocument document = new XDocument();
```
```csharp
using (XmlWriter writer = document.CreateWriter())
```
```csharp
{
```
```csharp
source.Write(writer);
```
```csharp
}
```
```csharp
return document;
```

}

Still take an RSS feed as example, the following code outputs the RSS feed’s schema:

internal static void InferSchemas()

```csharp
{
```
```csharp
XDocument aspNetRss = XDocument.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2");
```
```csharp
XmlSchemaSet schemaSet = aspNetRss.InferSchema();
```
```csharp
schemaSet.Schemas().Cast<XmlSchema>().WriteLines(schema => schema.ToXDocument().ToString());
```

}

The printed schema is:

<xs:schema attributeFormDefault\="unqualified" elementFormDefault\="qualified" xmlns:xs\="http://www.w3.org/2001/XMLSchema"\>

```csharp
<xs:element name="rss">
```
```csharp
<xs:complexType>
```
```csharp
<xs:sequence>
```
```csharp
<xs:element name="channel">
```
```csharp
<xs:complexType>
```
```csharp
<xs:sequence>
```
```csharp
<xs:element name="title" type="xs:string" />
```
```csharp
<xs:element name="link" type="xs:string" />
```
```csharp
<xs:element name="description" type="xs:string" />
```
```csharp
<xs:element maxOccurs="unbounded" name="item">
```
```csharp
<xs:complexType>
```
```csharp
<xs:sequence>
```
```csharp
<xs:element name="title" type="xs:string" />
```
```csharp
<xs:element name="link" type="xs:string" />
```
```csharp
<xs:element name="description" type="xs:string" />
```
```csharp
<xs:element name="pubDate" type="xs:string" />
```
```csharp
<xs:element name="guid">
```
```csharp
<xs:complexType>
```
```csharp
<xs:simpleContent>
```
```csharp
<xs:extension base="xs:string">
```
```csharp
<xs:attribute name="isPermaLink" type="xs:boolean" use="required" />
```
```csharp
</xs:extension>
```
```csharp
</xs:simpleContent>
```
```csharp
</xs:complexType>
```
```csharp
</xs:element>
```
```csharp
<xs:element maxOccurs="unbounded" name="category" type="xs:string" />
```
```csharp
</xs:sequence>
```
```csharp
</xs:complexType>
```
```csharp
</xs:element>
```
```csharp
</xs:sequence>
```
```csharp
</xs:complexType>
```
```csharp
</xs:element>
```
```csharp
</xs:sequence>
```
```csharp
<xs:attribute name="version" type="xs:decimal" use="required" />
```
```csharp
</xs:complexType>
```
```csharp
</xs:element>
```

</xs:schema\>

The data is all gone, and there is only structural description for that RSS feed. Save it to a .xsd file, then it can be visualized in Visual Studio’s XML Schema Explorer:

Now, this RSS feed’s schema, represented by XmlSchemaSet, can be used to validate XML. The following example calls the Validate extension methods for XDocument to validate another RSS feed from Flickr. As demonstrated before, Flickr RSS has more elements. Apparently the validation fails:

internal static void Validate()

```csharp
{
```
```csharp
XDocument aspNetRss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```csharp
XmlSchemaSet schemaSet = aspNetRss.InferSchema();
```

```csharp
XDocument flickrRss = XDocument.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2");
```
```csharp
flickrRss.Validate(
```
```csharp
schemaSet,
```
```csharp
(sender, args) =>
```
```csharp
{
```
```csharp
$"{args.Severity}: ({sender.GetType().Name}) => {args.Message}".WriteLine();
```
```csharp
// Error: (XElement) => The element 'channel' has invalid child element 'pubDate'. List of possible elements expected: 'item'.
```
```csharp
args.Exception?.WriteLine();
```
```csharp
// XmlSchemaValidationException: The element 'channel' has invalid child element 'pubDate'. List of possible elements expected: 'item'.
```
```csharp
});
```

}

Validate has another overload accepting a bool parameter addSchemaInfo. When it is called with true for addSchemaInfo, if an element or attribute is validated, the validation details are saved in an IXmlSchemaInfo instance, and associated with this element or attribute as an annotation. Then, the GetSchemaInfo method can be called on each element or attribute, to query that IXmlSchemaInfo annotation, if available. IXmlSchemaInfo can have a lot of information, including a Validity property, intuitively indicating the validation status:

internal static void GetSchemaInfo()

```csharp
{
```
```csharp
XDocument aspNetRss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```csharp
XmlSchemaSet schemaSet = aspNetRss.InferSchema();
```

```csharp
XDocument flickrRss = XDocument.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2");
```
```csharp
flickrRss.Validate(schemaSet, (sender, args) => { }, addSchemaInfo: true);
```
```csharp
flickrRss
```
```csharp
.Root
```
```csharp
.DescendantsAndSelf()
```
```csharp
.ForEach(element =>
```
```csharp
{
```
```csharp
$"{element.XPath()} - {element.GetSchemaInfo()?.Validity}".WriteLine();
```
```csharp
element.Attributes().WriteLines(attribute =>
```
```csharp
$"{attribute.XPath()} - {attribute.GetSchemaInfo()?.Validity.ToString() ?? "null"}");
```
```csharp
});
```
```csharp
// /rss - Invalid
```
```csharp
// /rss/@version - Valid
```
```csharp
// /rss/@xmlns:media - null
```
```csharp
// /rss/@xmlns:dc - null
```
```csharp
// /rss/@xmlns:creativeCommons - null
```
```csharp
// /rss/@xmlns:flickr - null
```
```csharp
// /rss/channel - Invalid
```
```csharp
// /rss/channel/title - Valid
```
```csharp
// /rss/channel/link - Valid
```
```csharp
// /rss/channel/description - Valid
```
```csharp
// /rss/channel/pubDate - Invalid
```
```csharp
// /rss/channel/lastBuildDate - NotKnown
```
```csharp
// ...
```

}

### Transforming XML with XSL

XSL (Extensible Stylesheet Language) can transform a XML tree to another. XSL transformation can be done with the System.Xml.Xsl.XslCompiledTransform type:

public static XDocument XslTransform(this XNode source, XNode xsl)

```csharp
{
```
```csharp
XDocument result = new XDocument();
```
```csharp
using (XmlReader sourceReader = source.CreateReader())
```
```csharp
using (XmlReader xslReader = xsl.CreateReader())
```
```csharp
using (XmlWriter resultWriter = result.CreateWriter())
```
```csharp
{
```
```csharp
XslCompiledTransform transform = new XslCompiledTransform();
```
```csharp
transform.Load(xslReader);
```
```csharp
transform.Transform(sourceReader, resultWriter);
```
```csharp
return result;
```
```csharp
}
```

}

The following example transforms RSS to HTML, the most recent 5 items in RSS are mapped to HTML hyperlinks in an unordered list:

internal static void XslTransform()

```csharp
{
```
```csharp
XDocument rss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```csharp
XDocument xsl = XDocument.Parse(@"
```
```csharp
<xsl:stylesheet version='1.0' xmlns:xsl='http://www.w3.org/1999/XSL/Transform'>
```
```csharp
<xsl:template match='/rss/channel'>
```
```csharp
<ul>
```
```csharp
<xsl:for-each select='item[position() &lt;= 5]'><!--Position is less than or equal to 5.-->
```
```csharp
<li>
```
```csharp
<a>
```
```csharp
<xsl:attribute name='href'><xsl:value-of select='link' /></xsl:attribute>
```
```csharp
<xsl:value-of select='title' />
```
```csharp
</a>
```
```csharp
</li>
```
```csharp
</xsl:for-each>
```
```csharp
</ul>
```
```csharp
</xsl:template>
```
```csharp
</xsl:stylesheet>");
```
```csharp
XDocument html = rss.XslTransform(xsl);
```
```csharp
html.WriteLine();
```
```csharp
// <ul>
```
```csharp
// <li>
```
```csharp
// <a href="https://weblogs.asp.net:443/dixin/c-6-0-exception-filter-and-when-keyword">C# 6.0 Exception Filter and when Keyword</a>
```
```csharp
// </li>
```
```csharp
// <li>
```
```csharp
// <a href="https://weblogs.asp.net:443/dixin/use-fiddler-with-node-js">Use Fiddler with Node.js</a>
```
```csharp
// </li>
```
```csharp
// <li>
```
```csharp
// <a href="https://weblogs.asp.net:443/dixin/diskpart-problem-cannot-select-partition">DiskPart Problem: Cannot Select Partition</a>
```
```csharp
// </li>
```
```csharp
// <li>
```
```csharp
// <a href="https://weblogs.asp.net:443/dixin/configure-git-for-visual-studio-2015">Configure Git for Visual Studio 2015</a>
```
```csharp
// </li>
```
```csharp
// <li>
```
```csharp
// <a href="https://weblogs.asp.net:443/dixin/query-operating-system-processes-in-c">Query Operating System Processes in C#</a>
```
```csharp
// </li>
```
```csharp
// </ul>
```

}

The above transformation can also be done with LINQ to Objects/XML query:

internal static void Transform()

```csharp
{
```
```csharp
XDocument rss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```csharp
XDocument html = rss
```
```csharp
.Element("rss")
```
```csharp
.Element("channel")
```
```csharp
.Elements("item")
```
```csharp
.Take(5)
```
```csharp
.Select(item =>
```
```csharp
{
```
```csharp
string link = (string)item.Element("link");
```
```csharp
string title = (string)item.Element("title");
```
```csharp
return new XElement("li", new XElement("a", new XAttribute("href", link), title));
```
```csharp
// Equivalent to: return XElement.Parse($"<li><a href='{link}'>{title}</a></li>");
```
```csharp
})
```
```csharp
.Aggregate(new XElement("ul"), (ul, li) => { ul.Add(li); return ul; }, ul => new XDocument(ul));
```
```csharp
html.WriteLine();
```

}

## Summary

This chapter discusses how to use LINQ to XML APIs to work with XML data. LINQ to XML provides types to model XML following a declarative paradigm. After loading XML into memory as objects, they can be queried by LINQ to Objects. LINQ to XML provides additional queries for XML, including DOM navigation, ordering, comparison, etc. LINQ to XML also provide APIs for XPath, as well as XML manipulation, annotation, validation, and transformation, etc.