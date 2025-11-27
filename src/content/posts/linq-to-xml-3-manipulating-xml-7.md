---
title: "LINQ to XML in Depth (3) Manipulating XML"
published: 2018-08-30
description: "Besides creating and querying XML, LINQ to XML also provides APIs for other XML manipulations, including cloning, deleting, replacing, and updating XML structures:"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[LINQ to XML in Depth series](/archive/?tag=LINQ%20to%20XML)\]

## **Latest version: [https://weblogs.asp.net/dixin/linq-to-xml-3-manipulating-xml](/posts/linq-to-xml-3-manipulating-xml "https://weblogs.asp.net/dixin/linq-to-xml-3-manipulating-xml")**

Besides creating and querying XML, LINQ to XML also provides APIs for other XML manipulations, including cloning, deleting, replacing, and updating XML structures:

-   Clone

-   Explicit Clone: constructors of XAttribute, XCData, XComment, XDeclaration, XDocument, XElement, XProcessingInstruction, XText

-   Add

-   Add annotations: XObject.AddAnnotation
-   Add children: XContainer.Add, XContainer.AddFirst, XStreamingElement.Add
-   Add siblings: XNode.AddAfterSelf, XNode.AddBeforeSelf

-   Delete

-   Delete annotations: XObject.RemoveAnnotations
-   Delete attributes: XElement.RemoveAttributes, XAttribute.Remove
-   Delete self: XNode.Remove
-   Delete children: XContainer.RemoveNodes, XElement.RemoveAll

-   Replace

-   Replace attributes: XElement.ReplaceAttributes
-   Replace self: XNode.ReplaceWith
-   Replace children: XContainer.ReplaceNodes, XElement.ReplaceAll

-   Update

-   Update attribute: XAttribute.Value
-   Update comment: XComment.Value
-   Update declaration: XDeclaration.Encoding, XDeclaration.Standalone, XDeclaration.Version
-   Update document: XDocument.XDeclaration, XDocumentType.InternalSubset, XDocumentType.Name, XDocumentType.PublicId, XDocumentType.SystemId
-   Update element: XElement.Name, XElement.Value, XElement.SetAttributeValue, XElement.SetElementValue, XElement.SetValue

> .NET Framework also provides APIs for validating and transforming XML:
> 
> -   Validate with XSD
> 
> -   Query schema: XAttribute.GetSchemaInfo\*, XElement.GetSchemaInfo\*
> -   Validate schema: XAttribute.Validate\*, XDocument.Validate\*, XElement.Validate\*
> 
> -   Transform with XSL: XslCompiledTransform.Transform
> 
> The APIs with \* are extension methods provided by System.Xml.Schema.Extensions.

## Clone

Most structures can be cloned by calling their constructors with the source instance:

```csharp
internal static void ExplicitClone()
{
    XElement sourceElement = XElement.Parse("<element />");
    XElement clonedElement = new XElement(sourceElement);

    XText sourceText = new XText("text");
    XText clonedText = new XText(sourceText);

    XDocument sourceDocument = XDocument.Load("https://weblogs.asp.net/dixin/rss");
    XDocument clonedDocument = new XDocument(sourceDocument);
    object.ReferenceEquals(sourceDocument, clonedDocument).WriteLine(); // False
    object.Equals(sourceDocument, clonedDocument).WriteLine(); // False
    EqualityComparer<XDocument>.Default.Equals(sourceDocument, clonedDocument).WriteLine(); // False
    sourceDocument.Equals(clonedDocument).WriteLine(); // False
    (sourceDocument == clonedDocument).WriteLine(); // False
    XNode.DeepEquals(sourceDocument, clonedDocument).WriteLine(); // True
    XNode.EqualityComparer.Equals(sourceDocument, clonedDocument).WriteLine(); // True
}
```

If an XObject instance is in an XML tree, when it is added to a different XML tree, it is cloned, and the new instance is actually added to the target. The exceptions are XName and XNamespace, which are cached at runtime. For example:

```csharp
internal static void ImplicitClone()
{
    XElement child = XElement.Parse("<child />");
    XName parentName = "parent";
    XElement parent1 = new XElement(parentName, child); // Attach.
    object.ReferenceEquals(child, parent1.Elements().Single()).WriteLine(); // True
    object.ReferenceEquals(parentName, parent1.Name).WriteLine(); // True

    XElement parent2 = new XElement(parentName, child); // Clone and attach.
    object.ReferenceEquals(child, parent2.Elements().Single()).WriteLine(); // False
    object.ReferenceEquals(parentName, parent2.Name).WriteLine(); // True

    XElement element = new XElement("element");
    element.Add(element); // Clone and attach.
    object.ReferenceEquals(element, element.Elements().Single()).WriteLine(); // False
}
```

## Add, delete, replace, update, and events

Most of APIs to add/replace/delete/update XML structures are very intuitive. And when changing a XObject instance, XObject.Changing and XObject.Changed events are fired before and after the change. For example:

```csharp
internal static void Manipulate()
{
    XElement child = new XElement("child");
    child.Changing += (sender, e) => 
        $"Before {e.ObjectChange}: ({sender.GetType().Name} {sender}) => {child}".WriteLine();
    child.Changed += (sender, e) => 
        $"After {e.ObjectChange}: ({sender.GetType().Name} {sender}) => {child}".WriteLine();
    XElement parent = new XElement("parent");
    parent.Changing += (sender, e) => 
        $"Before {e.ObjectChange}: ({sender.GetType().Name} {sender}) => {parent.ToString(SaveOptions.DisableFormatting)}".WriteLine();
    parent.Changed += (sender, e) => 
        $"After {e.ObjectChange}: ({sender.GetType().Name} {sender}) => {parent.ToString(SaveOptions.DisableFormatting)}".WriteLine();

    child.Value = "value1";
    // Before Add: (XText value1) => <child />
    // After Add: (XText value1) => <child>value1</child>

    child.Value = "value2";
    // Before Remove: (XText value1) => <child>value1</child>
    // After Remove: (XText value1) => <child />
    // Before Add: (XText value2) => <child />
    // After Add: (XText value2) => <child>value2</child>

    child.Value = string.Empty;
    // Before Remove: (XText value2) => <child>value2</child>
    // After Remove: (XText value2) => <child />
    // Before Value: (XElement <child />) => <child />
    // After Value: (XElement <child></child>) => <child></child>

    parent.Add(child);
    // Before Add: (XElement <child></child>) => <parent />
    // After Add: (XElement <child></child>) => <parent><child></child></parent>

    child.Add(new XAttribute("attribute", "value"));
    // Before Add: (XAttribute attribute="value") => <child></child>
    // Before Add: (XAttribute attribute="value") => <parent><child></child></parent>
    // After Add: (XAttribute attribute="value") => <child attribute="value"></child>
    // After Add: (XAttribute attribute="value") => <parent><child attribute="value"></child></parent>

    child.AddBeforeSelf(0);
    // Before Add: (XText 0) => <parent><child attribute="value"></child></parent>
    // After Add: (XText 0) => <parent>0<child attribute="value"></child></parent>

    parent.ReplaceAll(new XText("Text."));
    // Before Remove: (XText 0) => <parent>0<child attribute="value"></child></parent>
    // After Remove: (XText 0) => <parent><child attribute="value"></child></parent>
    // Before Remove: (XElement <child attribute="value"></child>) => <parent><child attribute="value"></child></parent>
    // After Remove: (XElement <child attribute="value"></child>) => <parent />
    // Before Add: (XText Text.) => <parent />
    // After Add: (XText Text.) => <parent>Text.</parent>

    parent.Name = "name";
    // Before Name: (XElement <parent>Text.</parent>) => <parent>Text.</parent>
    // After Name: (XElement <name>Text.</name>) => <name>Text.</name>

    XElement clonedChild = new XElement(child);
    clonedChild.SetValue(DateTime.Now); // No tracing.
}
```

There are many APIs to manipulate XML, but there are only 4 kinds of Changing/Changed events: add object, deleting object, update object value, update element/attribute name. For example, as shown above, the APIs to replace objects are shortcuts of deleting old objects and adding new objects. When setting a string as an element’s value, the element first removes its children if there is any, then add the string as a child text node, if the string is not empty string. Also, an object’s events propagate/bubble up to the ancestors, and children and siblings are not impacted. When an object is cloned, the new object’s events is not observed by the original event handlers.

XElement.SetAttributeValue and XElement.SetElementValue are different from other APIs. They can

-   add a new attribute/child element if it does not exist
-   update the attribute/child element value if it exists:
-   remove the attribute/child element if it exists and the provided value to null.

```csharp
internal static void SetAttributeValue()
{
    XElement element = new XElement("element");
    element.Changing += (sender, e) => 
        $"Before {e.ObjectChange}: ({sender.GetType().Name} {sender}) => {element}".WriteLine();
    element.Changed += (sender, e) => 
        $"After {e.ObjectChange}: ({sender.GetType().Name} {sender}) => {element}".WriteLine();

    element.SetAttributeValue("attribute", "value1"); // Equivalent to: child1.Add(new XAttribute("attribute", "value1"));
    // Before Add: (XAttribute attribute="value1") => <element />
    // After Add: (XAttribute attribute="value1") => <element attribute="value1" />

    element.SetAttributeValue("attribute", "value2"); // Equivalent to: child1.Attribute("attribute").Value = "value2";
    // Before Value: (XAttribute attribute="value1") => <element attribute="value1" />
    // After Value: (XAttribute attribute="value2") => <element attribute="value2" />

    element.SetAttributeValue("attribute", null);
    // Before Remove: (XAttribute attribute="value2") => <element attribute="value2" />
    // After Remove: (XAttribute attribute="value2") => <element />
}

internal static void SetElementValue()
{
    XElement parent = new XElement("parent");
    parent.Changing += (sender, e) => 
        $"Before {e.ObjectChange}: {sender} => {parent.ToString(SaveOptions.DisableFormatting)}".WriteLine();
    parent.Changed += (sender, e) => 
        $"After {e.ObjectChange}: {sender} => {parent.ToString(SaveOptions.DisableFormatting)}".WriteLine();

    parent.SetElementValue("child", string.Empty); // Add child element.
    // Before Add: <child></child> => <parent />
    // After Add: <child></child> => <parent><child></child></parent>

    parent.SetElementValue("child", "value"); // Update child element.
    // Before Value: <child></child> => <parent><child></child></parent>
    // After Value: <child /> => <parent><child /></parent>
    // Before Add: value => <parent><child /></parent>
    // After Add: value => <parent><child>value</child></parent>

    parent.SetElementValue("child", null); // Remove child element.
    // Before Remove: <child>value</child> => <parent><child>value</child></parent>
    // After Remove: <child>value</child> => <parent />
}
```

## Annotation

Annotation is not a part of the XML. It is an separate arbitrary data in the memory, and associated with a XObject instance in the memory. The annotation APIs provided by XObject allows adding/querying/deleting any .NET data. Apparently, when cloning or serializing XObject, annotation is ignored on the the new XObject and the generated string.

```csharp
internal static void Annotation()
{
    XElement element = new XElement("element");
    element.AddAnnotation(new Uri("https://microsoft.com"));

    Uri annotation = element.Annotation<Uri>();
    annotation.WriteLine(); // https://microsoft.com
    element.WriteLine(); // <element />

    XElement clone = new XElement(element); // element is cloned.
    clone.Annotations<Uri>().Any().WriteLine(); // False

    element.RemoveAnnotations<Uri>();
    (element.Annotation<Uri>() == null).WriteLine(); // True
}
```

## Validate XML with XSD

[XSD (XML Schema Definition)](https://en.wikipedia.org/wiki/XML_Schema_\(W3C\)) is the metadata of XML tree, including XML's elements, attributes, constrains rules, etc. System.Xml.Schema.Extensions provides a few APIs to validate XML with provided schema. To obtain a schema, one option is to infer it from existing XML:

```csharp
public static XmlSchemaSet InferSchema(this XNode source)
{
    XmlSchemaInference schemaInference = new XmlSchemaInference();
    using (XmlReader reader = source.CreateReader())
    {
        return schemaInference.InferSchema(reader);
    }
}
```

The returned XmlSchemaSet instance contains s sequence of XmlSchema instances, one for each namespace in the source XML. XmlSchema can be converted to XDocument with the help of XmlWriter:

```csharp
public static XDocument ToXDocument(this XmlSchema source)
{
    XDocument document = new XDocument();
    using (XmlWriter writer = document.CreateWriter())
    {
        source.Write(writer);
    }
    return document;
}
```

Still take an RSS feed as example, the following code outputs the RSS feed’s schema:

```csharp
internal static void InferSchemas()
{
    XDocument aspNetRss = XDocument.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2");
    XmlSchemaSet schemaSet = aspNetRss.InferSchema();
    schemaSet.Schemas().Cast<XmlSchema>().WriteLines(schema => schema.ToXDocument().ToString());
}
```

The printed schema is:

```csharp
<xs:schema attributeFormDefault="unqualified" elementFormDefault="qualified" xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="rss">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="channel">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="title" type="xs:string" />
              <xs:element name="link" type="xs:string" />
              <xs:element name="description" type="xs:string" />
              <xs:element maxOccurs="unbounded" name="item">
                <xs:complexType>
                  <xs:sequence>
                    <xs:element name="title" type="xs:string" />
                    <xs:element name="link" type="xs:string" />
                    <xs:element name="description" type="xs:string" />
                    <xs:element name="pubDate" type="xs:string" />
                    <xs:element name="guid">
                      <xs:complexType>
                        <xs:simpleContent>
                          <xs:extension base="xs:string">
                            <xs:attribute name="isPermaLink" type="xs:boolean" use="required" />
                          </xs:extension>
                        </xs:simpleContent>
                      </xs:complexType>
                    </xs:element>
                    <xs:element maxOccurs="unbounded" name="category" type="xs:string" />
                  </xs:sequence>
                </xs:complexType>
              </xs:element>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
      <xs:attribute name="version" type="xs:decimal" use="required" />
    </xs:complexType>
  </xs:element>
</xs:schema>
```

The data is all gone, and there is only structural description for that RSS feed. Save it to a .xsd file, then it can be visualized in Visual Studio’s XML Schema Explorer:

[![image_thumb2](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/LINQ-to-XML-in-Depth-3-Manipulating-XML_8D00/image_thumb2_thumb.png "image_thumb2")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/LINQ-to-XML-in-Depth-3-Manipulating-XML_8D00/image_thumb2_2.png)

Now, this RSS feed’s schema, represented by XmlSchemaSet, can be used to validate XML. The following example calls the Validate extension methods for XDocument to validate another RSS feed from Flickr. As demonstrated before, Flickr RSS has more elements. Apparently the validation fails:

```csharp
internal static void Validate()
{
    XDocument aspNetRss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
    XmlSchemaSet schemaSet = aspNetRss.InferSchema();

    XDocument flickrRss = XDocument.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2");
    flickrRss.Validate(
        schemaSet,
        (sender, args) =>
        {
            $"{args.Severity}: ({sender.GetType().Name}) => {args.Message}".WriteLine();
            // Error: (XElement) => The element 'channel' has invalid child element 'pubDate'. List of possible elements expected: 'item'.
            args.Exception?.WriteLine();
            // XmlSchemaValidationException: The element 'channel' has invalid child element 'pubDate'. List of possible elements expected: 'item'.
        });
}
```

Validate has another overload accepting a bool parameter addSchemaInfo. When it is called with true for addSchemaInfo, if an element or attribute is validated, the validation details are saved in an IXmlSchemaInfo instance, and associated with this element or attribute as an annotation. Then, the GetSchemaInfo method can be called on each element or attribute, to query that IXmlSchemaInfo annotation, if available. IXmlSchemaInfo can have a lot of information, including a Validity property, intuitively indicating the validation status:

```csharp
internal static void GetSchemaInfo()
{
    XDocument aspNetRss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
    XmlSchemaSet schemaSet = aspNetRss.InferSchema();

    XDocument flickrRss = XDocument.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2");
    flickrRss.Validate(schemaSet, (sender, args) => { }, addSchemaInfo: true);
    flickrRss
        .Root
        .DescendantsAndSelf()
        .ForEach(element =>
        {
            $"{element.XPath()} - {element.GetSchemaInfo()?.Validity}".WriteLine();
            element.Attributes().WriteLines(attribute => 
                $"{attribute.XPath()} - {attribute.GetSchemaInfo()?.Validity.ToString() ?? "null"}");
        });
    // /rss - Invalid
    // /rss/@version - Valid
    // /rss/@xmlns:media - null
    // /rss/@xmlns:dc - null
    // /rss/@xmlns:creativeCommons - null
    // /rss/@xmlns:flickr - null
    // /rss/channel - Invalid
    // /rss/channel/title - Valid
    // /rss/channel/link - Valid
    // /rss/channel/description - Valid
    // /rss/channel/pubDate - Invalid
    // /rss/channel/lastBuildDate - NotKnown
    // ...
}
```

## Transform XML with XSL

[XSL (Extensible Stylesheet Language)](https://en.wikipedia.org/wiki/XSL) can transform a XML tree to another. XSL transformation can be done with the System.Xml.Xsl.XslCompiledTransform type:

```csharp
public static XDocument XslTransform(this XNode source, XNode xsl)
{
    XDocument result = new XDocument();
    using (XmlReader sourceReader = source.CreateReader())
    using (XmlReader xslReader = xsl.CreateReader())
    using (XmlWriter resultWriter = result.CreateWriter())
    {
        XslCompiledTransform transform = new XslCompiledTransform();
        transform.Load(xslReader);
        transform.Transform(sourceReader, resultWriter);
        return result;
    }
}
```

The following example transforms RSS to HTML, the most recent 5 items in RSS are mapped to HTML hyperlinks in an unordered list:

```csharp
internal static void XslTransform()
{
    XDocument rss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
    XDocument xsl = XDocument.Parse(@"
        <xsl:stylesheet version='1.0' xmlns:xsl='http://www.w3.org/1999/XSL/Transform'>
            <xsl:template match='/rss/channel'>
            <ul>
                <xsl:for-each select='item[position() &lt;= 5]'><!--Position is less than or equal to 5.-->
                <li>
                    <a>
                    <xsl:attribute name='href'><xsl:value-of select='link' /></xsl:attribute>
                    <xsl:value-of select='title' />
                    </a>
                </li>
                </xsl:for-each>
            </ul>
            </xsl:template>
        </xsl:stylesheet>");
    XDocument html = rss.XslTransform(xsl);
    html.WriteLine();
    // <ul>
    //  <li>
    //    <a href="https://weblogs.asp.net:443/dixin/c-6-0-exception-filter-and-when-keyword">C# 6.0 Exception Filter and when Keyword</a>
    //  </li>
    //  <li>
    //    <a href="https://weblogs.asp.net:443/dixin/use-fiddler-with-node-js">Use Fiddler with Node.js</a>
    //  </li>
    //  <li>
    //    <a href="https://weblogs.asp.net:443/dixin/diskpart-problem-cannot-select-partition">DiskPart Problem: Cannot Select Partition</a>
    //  </li>
    //  <li>
    //    <a href="https://weblogs.asp.net:443/dixin/configure-git-for-visual-studio-2015">Configure Git for Visual Studio 2015</a>
    //  </li>
    //  <li>
    //    <a href="https://weblogs.asp.net:443/dixin/query-operating-system-processes-in-c">Query Operating System Processes in C#</a>
    //  </li>
    // </ul>
}
```

The above transformation can also be done with LINQ to Objects/XML query:

```csharp
internal static void Transform()
{
    XDocument rss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
    XDocument html = rss
        .Element("rss")
        .Element("channel")
        .Elements("item")
        .Take(5)
        .Select(item =>
        {
            string link = (string)item.Element("link");
            string title = (string)item.Element("title");
            return new XElement("li", new XElement("a", new XAttribute("href", link), title));
            // Equivalent to: return XElement.Parse($"<li><a href='{link}'>{title}</a></li>");
        })
        .Aggregate(new XElement("ul"), (ul, li) => { ul.Add(li); return ul; }, ul => new XDocument(ul));
    html.WriteLine();
}
```