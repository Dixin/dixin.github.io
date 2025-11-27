---
title: "LINQ to XML in Depth (2) Query Methods (Operators)"
published: 2019-08-16
description: "As fore mentioned, LINQ to XML is just a specialized LINQ to Objects, so all the LINQ to Objects queries can be used in LINQ to XML queries. LINQ to XML provides many additional functions and queries"
image: ""
tags: ["C#", ".NET", "LINQ", "LINQ to XML", "XML", "LINQ via C#"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[LINQ to XML in Depth series](/archive/?tag=LINQ%20to%20XML)\]

As fore mentioned, LINQ to XML is just a specialized LINQ to Objects, so all the LINQ to Objects queries can be used in LINQ to XML queries. LINQ to XML provides many additional functions and queries for XML tree navigation, ordering, XPath querying, etc. The following list shows these functions and their return types:

· Navigation queries

o Query direct parent element

§ XObject.Parent -> XElement

o Query all ancestor elements:

§ XNode.Ancestors -> IEnumerable<XElement>

§ XElement.AncestorsAndSelf -> IEnumerable<XElement>

§ IEnumerable<T>.Ancestors\* -> IEnumerable<XElement>, where T : XNode

§ IEnumerable<XElement>.AncestorsAndSelf\* -> IEnumerable<XElement>

o Query direct child elements

§ XDocument.Root-> XElement

§ XContainer.Element -> XElement

§ XContainer.Elements ->IEnumerable<XElement>

§ IEnumerable<T>.Elements\* -> IEnumerable<XElement>, where T : XContainer

o Query direct child nodes

§ XContainer.FirstNode -> XNode

§ XContainer.LastNode -> XNode

§ XContainer.Nodes -> IEnumerable<XNode>

§ IEnumerable<T>.Nodes\* -> IEnumerable<XNode>, where T : XContainer

o Query all descendant elements

§ XContainer.Descendants ->IEnumerable<XElement>

§ XElement.DescendantsAndSelf -> IEnumerable<XElement>

§ IEnumerable<T>.Descendants\* -> IEnumerable<XElement>, where T : XContainer

§ IEnumerable<XElement>.DescendantsAndSelf\* -> IEnumerable<XElement>

o Query all descendant nodes

§ XContainer.DescendantNodes -> IEnumerable<XNode>

§ XElement.DescendantNodesAndSelf -> IEnumerable<XNode>

§ IEnumerable<T>.DescendantNodes\* -> IEnumerable<XNode>, where T : XContainer

§ IEnumerable<XElement>.DescendantNodesAndSelf\* -> IEnumerable<XNode>

o Query sibling elements

§ XNode.ElementsAfterSelf -> IEnumerable<XElement>

§ XNode.ElementsBeforeSelf -> IEnumerable<XElement>

o Query sibling nodes

§ XNode.PreviousNode -> XNode

§ XNode.NextNode -> XNode

§ XNode.NodesBeforeSelf ->IEnumerable<XNode>

§ XNode.NodesAfterSelf ->IEnumerable<XNode>

o Query attributes

§ XAttribute.PreviousAttribute –> XAttribute

§ XAttribute.NextAttribute -> XAttribute

§ XElement.FirstAttribute -> XAttribute

§ XElement.LastAttribute -> XAttribute

§ XElement.Attribute -> XAttribute

§ XElement.Attributes ->IEnumerable<XAttribute>

§ IEnumerable<XElement>.Attributes\* -> IEnumerable<XAttribute>

o Query document

§ XObject.Document –> XDocument

o Query annotations

§ XObject.Annotation<T> –> T, where T : class

§ XObject.Annotations –>IEnumerable<object>

· Ordering queries

o XNode.CompareDocumentOrder -> int

o XNode.IsAfter -> bool

o XNode.IsBefore -> bool

o XNodeDocumentOrderComparer.Compare -> int

o IEnumerable<T>.InDocumentOrder\* -> IEnumerable<T>, where T : XNode

· Comparison queries

o XNode.DocumentOrderComparer –> XNodeDocumentOrderComparer

o XNodeDocumentOrderComparer.Compare –> int

o XNode.EqualityComparer –> XNodeEqualityComparer

o XNodeEqualityComparer.Equals –> bool

· XPath queries

o XNode.CreateNavigator\*\* –> XPathNavigator

o XNode.XPathSelectElement\*\* –> XElement

o XNode.XPathSelectElements\*\* –> IEnumerable<XElement>

o XNode.XPathEvaluate\*\* –> object

The functions with \* are extension methods provided in static type System.Xml.Linq.Extensions. The functions with \*\* are extension methods provided in static type System.Xml.XPath.Extensions. The other unmarked methods are instance methods or properties.

### Navigation

LINQ to XML provides rich APIs for navigation. And the queries with IEnumerable<XObject> output are also called axis methods or axes. The following example queries the parent element and ancestor element, where. ancestors are parent, parent’s parent, …, recursively:

internal static void ParentAndAncestors()
```
{
```
```
XElement element = new XElement("element");
```
```
XDocument document = new XDocument(new XElement("grandparent", new XElement("parent", element)));
```
```
element.Parent.Name.WriteLine(); // parent
```
```
element
```
```
.Ancestors()
```
```
.Select(ancestor => ancestor.Name)
```
```
.WriteLines(); // parent grandparent
```
```
element
```
```
.AncestorsAndSelf()
```
```
.Select(selfOrAncestor => selfOrAncestor.Name)
```
```
.WriteLines(); // element parent grandparent
```
```
object.ReferenceEquals(element.Ancestors().Last(), element.Document.Root).WriteLine(); // True.
```

}

Notice AncestorsAndSelf first yields self, then yields ancestors recursively. It could be more intuitive if named as SelfAndAncestors.

The following example queries direct child elements. In RSS feed, each <item> can have 0, 1, or multiple tags. And these tags are <category> elements under each <item> element. The following code queries a given RSS feed to get the items with a permalink, then queries the top 5 tags used by these items:

internal static void ChildElements()
```
{
```
```
XDocument rss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```
IEnumerable<string>categories = rss
```
```
.Root // <rss>.
```
```
.Element("channel") // Single< channel> under <rss>.
```
```
.Elements("item") // All< item>s under single <channel>.
```
```
.Where(item => (bool)item
```
```
.Element("guid") // Single <guid> under each <item>
```
```
.Attribute("isPermaLink")) // isPermaLink attribute of <guid>.
```
```
.Elements("category") // All <category>s under all <item>s.
```
```
.GroupBy(
```
```
keySelector: category => (string)category, // String value of each <category>.
```
```
elementSelector: category => category,
```
```
resultSelector: (key, group) => new { Name = key, Count = group.Count() },
```
```
comparer: StringComparer.OrdinalIgnoreCase)
```
```
.OrderByDescending(category => category.Count)
```
```
.Take(5)
```
```
.Select(category => $"[{category.Name}]:{category.Count}");
```
```
string.Join(" ", categories).WriteLine();
```
```
// [C#]:9 [LINQ]:6 [.NET]:5 [Functional Programming]:4 [LINQ via C#]:4
```

}

Similar to ancestors, descendants are children, children’s children, …, recursively:

internal static void ChildrenAndDescendants()
```
{
```
```
XElement root = XElement.Parse(@"
```
```
<root>
```
```
<![CDATA[cdata]]>0<!--Comment-->
```
```
<element>1</element>
```
```
<element>2<element>3</element></element>
```
```
</root>");
```
```
root.Elements()
```
```
.WriteLines(element => element.ToString(SaveOptions.DisableFormatting));
```
```
// <element>1</element>
```
```
// < element>2<element>3</element></element>
```
```
root.Nodes()
```
```
.WriteLines(node => $"{node.NodeType}: {node.ToString(SaveOptions.DisableFormatting)}");
```
```
// CDATA: <![CDATA[cdata]]>
```
```
// Text: 0
```
```
// Comment: <!--Comment-->
```
```
// Element: < element>1</element>
```
```
// Element: <element>2<element>3</element></element>
```
```
root.Descendants()
```
```
.WriteLines(element => element.ToString(SaveOptions.DisableFormatting));
```
```
// <element>1</element>
```
```
// < element>2<element>3</element></element>
```
```
// <element>3</element>
```
```
root.DescendantNodes()
```
```
.WriteLines(node => $"{node.NodeType}: {node.ToString(SaveOptions.DisableFormatting)}");
```
```
// CDATA: <![CDATA[cdata]]>
```
```
// Text: 0
```
```
// Comment: <!--Comment-->
```
```
// Element: < element>1</element>
```
```
// Text: 1
```
```
// Element: < element>2<element>3</element></element>
```
```
// Text: 2
```
```
// Element: < element>3</element>
```
```
// Text: 3
```

}

Regarding all the X\* types are reference types, when querying the same XML tree, multiple queries’ results from the same source tree can reference to the same instance:

internal static void ResultReferences()
```
{
```
```
XDocument rss1 = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```
XElement[] items1 = rss1.Descendants("item").ToArray();
```
```
XElement[] items2 = rss1.Element("rss").Element("channel").Elements("item").ToArray();
```
```
object.ReferenceEquals(items1.First(), items2.First()).WriteLine(); // True
```
```
items1.SequenceEqual(items2).WriteLine(); // True
```
```
XDocument rss2 = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```
XElement[] items3 = rss2.Root.Descendants("item").ToArray();
```
```
object.ReferenceEquals(items1.First(), items3.First()).WriteLine(); // False
```
```
items1.SequenceEqual(items3).WriteLine(); // False
```

}

Again, LINQ to XML is just a specialized LINQ to Objects. For example, the implementation of XNode.Ancestors is equivalent to:

namespace System.Xml.Linq
```
{
```
```
public abstract class XNode : XObject
```
```
{
```
```
public IEnumerable<XElement> Ancestors()
```
```
{
```
```
for (XElement parent = this.Parent; parent != null; parent = parent.Parent)
```
```
{
```
```
yield return parent;
```
```
}
```
```
}
```
```
// Other members.
```
```
}
```

}

And the implementation of the Extensions.Ancestors query is equivalent to:

namespace System.Xml.Linq
```
{
```
```
public static partial class Extensions
```
```
{
```
```
public static IEnumerable<XElement> Ancestors<T>(this IEnumerable<T> source) where T : XNode =>
```
```
source
```
```
.Where(node => node != null)
```
```
.SelectMany(node => node.Ancestors())
```
```
// Other members.
```
```
}
```

}

### Ordering

Besides the LINQ to Objects ordering queries, additional ordering queries are provided by LINQ to XML. The InDocumentOrder query orders nodes by their positions in the XML tree, from top node down. For example, above Ancestors yields parent, parent’s parent, …, recursively. InDocumentOrder can reorder them from top down. As a result, the query result is reversed:

internal static void DocumentOrder()
```
{
```
```
XElement element1 = new XElement("element");
```
```
XElement element2 = new XElement("element");
```
```
XDocument document = new XDocument(new XElement("grandparent", new XElement("parent", element1, element2)));
```
```
element1.IsBefore(element2).WriteLine(); // True
```
```
XNode.DocumentOrderComparer.Compare(element1, element2).WriteLine(); // -1
```
```
XElement[] ancestors = element1.Ancestors().ToArray();
```
```
XNode.CompareDocumentOrder(ancestors.First(), ancestors.Last()).WriteLine(); // 1
```
```
ancestors
```
```
.InDocumentOrder()
```
```
.Select(ancestor => ancestor.Name)
```
```
.WriteLines(); // grandparent parent
```
```
element1
```
```
.AncestorsAndSelf()
```
```
.Reverse()
```
```
.SequenceEqual(element1.AncestorsAndSelf().InDocumentOrder())
```
```
.WriteLine(); // True
```

}

Apparently, InDocumentOrder requires the source nodes sequence to be in the same XML tree. This is determined by looking up a common ancestor of the source nodes:

internal static void CommonAncestor()
```
{
```
```
XElement root = XElement.Parse(@"
```
```
<root>
```
```
<element value='4' />
```
```
<element value='2' />
```
```
<element value='3'><element value='1' /></element>
```
```
</root>");
```
```
XElement[] elements = root
```
```
.Descendants("element")
```
```
.OrderBy(element => (int)element.Attribute("value")).ToArray();
```
```
elements.WriteLines(ancestorOrSelf => ancestorOrSelf.ToString(SaveOptions.DisableFormatting));
```
```
// <element value="1" />
```
```
// <element value="2" />
```
```
// <element value="3"><element value="1" /></element>
```
```
// <element value="4" />
```
```
new XElement[] { elements.First(), elements.Last() }
```
```
.InDocumentOrder()
```
```
.WriteLines(ancestorOrSelf => ancestorOrSelf.ToString(SaveOptions.DisableFormatting));
```
```
// <element value="4" />
```
```
// <element value="1" />
```
```
new XElement[] { elements.First(), elements.Last(), new XElement("element") }
```
```
.InDocumentOrder()
```
```
.WriteLines();
```
```
// InvalidOperationException: A common ancestor is missing.
```

}

Notice in the inline XML string, single quotes are used for attribute values, instead of double quotes. This is for readability of C# code, otherwise "" or \\" has to be used. According to the W3C XML spec, single quote is legal.

### Comparison

LINQ to Objects provides many queries accepting IComparer<T> or IEqualityComparer<T> parameter. To use those queries with XML, LINQ to XML provides 2 built-in comparers:

· XNodeDocumentOrderComparer, which implements IComparer<XNode>. Its Compare method simply calls XNode.CompareDocumentOrder. Its instance is provided by XNode.DocumentOrderComparer property.

· XNodeEqualityComparer, which implements IEqualityComparer<XNode>. Its Equals method simply calls XNode.DeepEquals. Its instance is provided by XNode.EqualityComparer property.

For example, above InDocumentOrder query simply calls OrderBy with XNodeDocumentOrderComparer. Its implementation is equivalent to:

public static partial class Extensions
```
{
```
```
public static IEnumerable<T> InDocumentOrder<T>(this IEnumerable<T> source) where T : XNode =>
```
```
source.OrderBy(node => node, XNode.DocumentOrderComparer);
```

}

## More useful custom queries

With the knowledge of LINQ to Objects and LINQ to XML APIs, more useful queries can be implemented. For example, the following DescendantObjects queries an XObject source’s all descendant XObject instances:

public static partial class XExtensions
```
{
```
```
public static IEnumerable<XObject> DescendantObjects(this XObject source) =>
```
```
Enumerable
```
```
.Empty<XObject>()
```
```
.Concat(
```
```
source is XElement element
```
```
? element.Attributes() // T is covariant in IEnumerable<T>.
```
```
: Enumerable.Empty<XObject>())
```
```
.Concat(
```
```
source is XContainer container
```
```
? container
```
```
.DescendantNodes()
```
```
.SelectMany(descendant => EnumerableEx
```
```
.Return(descendant)
```
```
.Concat(
```
```
descendant is XElement descendantElement
```
```
? descendantElement.Attributes() // T is covariant in IEnumerable<T>.
```
```
: Enumerable.Empty<XObject>()))
```
```
: Enumerable.Empty<XObject>());
```

}

As fore mentioned, XObject can be either node or attribute. So, in the query, If the source is element, it yields the element’s attributes; if the source is XContainer, it yields each descendant node; If a descendant node is element, it yields the attributes.

The following SelfAndDescendantObjects query is intuitive by name and straightforward to implement:

public static IEnumerable<XObject\> SelfAndDescendantObjects(this XObject source) =>
```
EnumerableEx
```
```
.Return(source)
```

.Concat(source.DescendantObjects());

The following Names query finds a XContainer source for all elements’ and attributes’ names:

public static IEnumerable<XName\> Names(this XContainer source) =>
```
(source is XElement element
```
```
? element.DescendantsAndSelf()
```
```
: source.Descendants())
```
```
.SelectMany(descendantElement => EnumerableEx
```
```
.Return(descendantElement.Name)
```
```
.Concat(descendantElement
```
```
.Attributes()
```
```
.Select(attribute => attribute.Name)))
```

.Distinct();

As fore mentioned, XName instances are cached, so Distinct is called to remove the duplicated references.

Above built-in Attributes query finds an element’s attributes. The following AllAttributes queries an XContainer source’s attributes (if it is an element) and all its descendant elements’ attributes:

public static IEnumerable<XAttribute\> AllAttributes(this XContainer source) =>
```
(source is XElement element
```
```
? element.DescendantsAndSelf()
```
```
: source.Descendants())
```

.SelectMany(elementOrDescendant => elementOrDescendant.Attributes());

The following Namespaces query finds all namespaces defined in a XContainer source:

public static IEnumerable<(string, XNamespace)> Namespaces(this XContainer source) =>
```
source // Namespaces are defined as xmlns:prefix="namespace" attributes.
```
```
.AllAttributes()
```
```
.Where(attribute => attribute.IsNamespaceDeclaration)
```

.Select(attribute => (attribute.Name.LocalName, (XNamespace)attribute.Value));

It outputs a sequence of (prefix, namespace) tuples, which is very handy. With its help, the following function can be defined to create XmlNamespaceManager from any XContainer source:

public static XmlNamespaceManager CreateNamespaceManager(this XContainer source)
```
{
```
```
XmlNamespaceManager namespaceManager = new XmlNamespaceManager(new NameTable());
```
```
source
```
```
.Namespaces()
```
```csharp
.ForEach(@namespace => namespaceManager.AddNamespace(@namespace.Item1, @namespace.Item2.ToString()));
```
```
return namespaceManager;
```

}

This function is used later when working with XPath.

## XPath

XPath is a simple query language to select or evaluate objects from an XML tree. It consists of 3 parts:

· axis, e.g.:

o / is to select root node (either a document node, or an element node on the fly)

o /rss/channel/item is to select root node, then select root node’s all <rss> direct child elements, then select each < rss> element’s all <channel> child elements, then select each < channel> element’s all <item> child elements

o /rss/@version is to select root node, then select root node’s all <rss> direct child elements, then select each< rss> element’s version attribute

· node test

o text() is to select all text nodes, comment() is to select all comment nodes, etc.

o /element/text() is to select root node, then select all <element> child elements, then select each <element> element’s all child text nodes.

· predicate:

o \[1\] means select the first node, etc.

o /rss\[1\]/text()\[2\] means to select root node, then select the first <rss> child element, then select that <rss> element’s second child text node.

LINQ to XML also provides a few extension methods to work with XPath. The latest XPath version is 3.0, .NET Standard and LINQ to XML implements XPath 1.0.

The CreateNavigator method creates a XmlXPathNavigator, which can be used for navigation and querying:

internal static void XPathNavigator()
```
{
```
```
XDocument rss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```
XPathNavigator rssNavigator = rss.CreateNavigator();
```
```
rssNavigator.NodeType.WriteLine(); // Root
```
```
rssNavigator.MoveToFirstChild().WriteLine(); // True
```
```
rssNavigator.Name.WriteLine(); // rss
```
```
((XPathNodeIterator)rssNavigator
```
```
.Evaluate("/rss/channel/item[guid/@isPermaLink='true']/category"))
```
```
.Cast<XPathNavigator>()
```
```
.Select(categoryNavigator => categoryNavigator.UnderlyingObject)
```
```
.Cast<XElement>()
```
```
.GroupBy(
```
```
category => category.Value, // Current text node's value.
```
```
category => category,
```
```
(key, group) => new { Name = key, Count = group.Count() },
```
```
StringComparer.OrdinalIgnoreCase)
```
```
.OrderByDescending(category => category.Count)
```
```
.Take(5)
```
```
.Select(category => $"[{category.Name}]:{category.Count}")
```
```
.WriteLines();
```
```
// [C#]:9 [LINQ]:6 [.NET]:5 [Functional Programming]:4 [LINQ via C#]:4
```

}

It implements the same query as previous RSS tags example.

The XPathSelectElements method is a shortcut of calling CreateNavigator to get an XPathNavigator and then call Evaluate. The above query can be shortened as:

internal static void XPathQuery()
```
{
```
```
XDocument rss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```
rss
```
```
.XPathSelectElements("/rss/channel/item[guid/@isPermaLink='true']/category")
```
```
.GroupBy(
```
```
category => category.Value, // Current text node's value.
```
```
category => category,
```
```
(key, group) => new { Name = key, Count = group.Count() },
```
```
StringComparer.OrdinalIgnoreCase)
```
```
.OrderByDescending(category => category.Count)
```
```
.Take(5)
```
```
.Select(category => $"[{category.Name}]:{category.Count}")
```
```
.WriteLines();
```
```
// [C#]:9 [LINQ]:6 [.NET]:5 [Functional Programming]:4 [LINQ via C#]:4
```

}

And XPathSelectElement is simply a shortcut of calling XPathSelectElements to get a sequence, then call FirstOrDefault.

XPathEvaluate also calls CreateNavigator and then Evaluate, but it is more flexible. When the XPath is evaluated to a single value, it just returns that value. The following example queries the RSS feed for the average tags count of each <item> element, and also the equivalent LINQ query:

internal static void XPathEvaluateValue()
```
{
```
```
XDocument rss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```
double average1 = (double)rss.XPathEvaluate("count(/rss/channel/item/category) div count(/rss/channel/item)");
```
```
average1.WriteLine(); // 4.65
```
```
double average2 = rss
```
```
.Element("rss")
```
```
.Element("channel")
```
```
.Elements("item")
```
```
.Average(item => item.Elements("category").Count());
```
```
average2.WriteLine(); // 4.65
```

}

When the XPath is evaluated to a sequence of values, XPathEvaluate outputs IEnumerable<object>:

internal static void XPathEvaluateSequence()
```
{
```
```
XDocument rss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```
((IEnumerable<object>)rss
```
```
.XPathEvaluate("/rss/channel/item[guid/@isPermaLink='true']/category/text()"))
```
```
.Cast<XText>()
```
```
.GroupBy(
```
```
categoryTextNode => categoryTextNode.Value, // Current text node's value.
```
```
categoryTextNode => categoryTextNode,
```
```
(key, group) => new { Name = key, Count = group.Count() },
```
```
StringComparer.OrdinalIgnoreCase)
```
```
.OrderByDescending(category => category.Count)
```
```
.Take(5)
```
```
.Select(category => $"[{category.Name}]:{category.Count}")
```
```
.WriteLines();
```
```
// [C#]:9 [LINQ]:6 [.NET]:5 [Functional Programming]:4 [LINQ via C#]:4
```

}

LINQ to XML also provides overloads for these XPath methods to accept an IXmlNamespaceResolver parameter. When the XPath expression involves namespace, an IXmlNamespaceResolver instance must be provided. Taking another RSS feed from Flickr as an example:

<?xml version\="1.0" encoding\="utf-8"?>
```
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:flickr="urn:flickr:user">
```
```
<channel>
```
```
<item>
```
```
<title>Microsoft Way, Microsoft Campus</title>
```
```
<dc:date.Taken>2011-11-02T16:45:54-08:00</dc:date.Taken>
```
```
<author flickr:profile="https://www.flickr.com/people/dixin/">nobody@flickr.com (Dixin Yan)</author>
```
```
<media:content url="https://farm3.staticflickr.com/2875/9215169916_f8fa57c3da_b.jpg" type="image/jpeg" height="681" width="1024"/>
```
```
<media:title>Microsoft Way, Microsoft Campus</media:title>
```
```
<media:description type="html">
```
```
<p>Microsoft Campus is the informal name of Microsoft's corporate headquarters, located at One Microsoft Way in Redmond, Washington. Microsoft initially moved onto the grounds of the campus on February 26, 1986. <a href="http://en.wikipedia.org/wiki/Microsoft_Redmond_Campus" rel="nofollow">en.wikipedia.org/wiki/Microsoft_Redmond_Campus</a></p>
```
```
</media:description>
```
```
<media:thumbnail url="https://farm3.staticflickr.com/2875/9215169916_f8fa57c3da_s.jpg" height="75" width="75"/>
```
```
<media:credit role="photographer">Dixin Yan</media:credit>
```
```
<media:category scheme="urn:flickr:tags">microsoft</media:category>
```
```
<!-- Other elements. -->
```
```
</item>
```
```
<!-- Other items. -->
```
```
</channel>
```

</rss\>

It contains additional information than the standard RSS format, and these additional elements/attributes are managed by namespaces. The following example calls the overload of XPathSelectElements to query the <media:category> elements:

internal static void XPathQueryWithNamespace()
```
{
```
```
XDocument rss = XDocument.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2");
```
```
XmlNamespaceManager namespaceManager = rss.CreateNamespaceManager();
```
```
IEnumerable<XElement>query1 = rss.XPathSelectElements("/rss/channel/item/media:category", namespaceManager);
```
```
query1.Count().WriteLine(); // 20
```
```
IEnumerable<XElement> query2 = rss.XPathSelectElements("/rss/channel/item/media:category");
```
```
// XPathException: Namespace Manager or XsltContext needed. This query has a prefix, variable, or user-defined function.
```

}

Since prefix “media” is in XPath expression, An IXmlNamespaceResolver instance is required. XmlNamespaceManager implements IXmlNamespaceResolver, so simply call the previously defined CreateNamespaceManager method to create it. In contrast, querying the same XPath expression without IXmlNamespaceResolver instance throws XPathException.

The last example calls the overload of XPathEvaluate to query the items’ titles, which has the tag “microsoft” in the< media:category> element:

internal static void XPathEvaluateSequenceWithNamespace()
```
{
```
```
XDocument rss = XDocument.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2");
```
```
((IEnumerable<object>)rss
```
```
.XPathEvaluate(
```
```
"/rss/channel/item[contains(media:category/text(), 'microsoft')]/media:title/text()",
```
```
rss.CreateNamespaceManager()))
```
```
.Cast<XText>()
```
```
.WriteLines(mediaTitle => mediaTitle.Value);
```
```
// Chinese President visits Microsoft
```
```
// Satya Nadella, CEO of Microsoft
```

}

### Generate XPath expression

To leverage LINQ to XML, one example is to generate XPath expression for a specified XObject instance, which can be either XAttribute or XNode. The XPath expression can be calculated with the following 3 segments are needed:

1. the XPath of current object’s parent Element, which can be either calculated recursively, or be provided by caller.

2. the XPath of current object, which can be

o @attributeName if it is an attribute

o elementName if it is an element

o node test like text(), comment(), etc., if it is any other type of node.

3. a predicate for current object, which can simply be the position:

o For example, \[2\] can be used to identify a comment node, if there is another sibling comment node before itself

o also, the position predicate can be omitted if current object has no ambiguous sibling objects, so that XPath of parent object combining XPath of current object selects one single object. For example, if current node is a comment node with no sibling comment node, then parentElement/comment() without position predicate is good enough

First of all, a helper function is needed to calculate the current element or attribute’s name, which should be in simple localName format if the XName instance is not under any namespace, and should be in prefix:localName format if the XName instance is under a namespace. XName.ToString does not work for this requirement, because it returns the {namespaceUri}localName format, as already demonstrated. So, the following XPath extension method can be defined for name:

public static string XPath(this XName source, XElement container)
```
{
```
```
string prefix = source.Namespace == XNamespace.None
```
```
? null
```
```
: container.GetPrefixOfNamespace(source.Namespace); // GetPrefixOfNamespace returns null if not found.
```
```
return string.IsNullOrEmpty(prefix) ? source.ToString() : $"{prefix}:{source.LocalName}";
```

}

Regarding the above segment 1 and segment 2 has to be combined, another helper function is needed to combine 2 XPath expressions, which is similar to .NET built-in Combine method provided by System.IO.Path:

private static string CombineXPath(string xPath1, string xPath2, string predicate = null) =>
```
string.Equals(xPath1, "/", StringComparison.Ordinal) || string.IsNullOrEmpty(xPath2)
```
```
? $"{xPath1}{xPath2}{predicate}"
```

: $"{xPath1}/{xPath2}{predicate}";

Regarding XObject can be either one type of attribute, or several types of nodes, apparently attribute does not need the position predicate, while the different types of nodes all share similar logic to identify the position and the ambiguous siblings. So, the following helper function can be defined for XNode:

private static string XPath<TSource\>(
```
this TSource source,
```
```
string parentXPath,
```
```
string selfXPath = null,
```
```
Func<TSource, bool> siblingPredicate = null) where TSource : XNode
```
```
{
```
```
int index = source
```
```
.NodesBeforeSelf()
```
```
.Cast<TSource>()
```
```
.Where(siblingPredicate ?? (_ => true))
```
```
.Count();
```
```
string predicate = index == 0
```
```
&& !source
```
```
.NodesAfterSelf()
```
```
.Cast<TSource>()
```
```
.Where(siblingPredicate ?? (_ => true))
```
```
.Any()
```
```
? null
```
```
: $"[{index + 1}]";
```
```
return CombineXPath(parentXPath, selfXPath, predicate);
```

}

Now, the following XPath extension method can be defined to generate XPath expression for an element:

public static string XPath(this XElement source, string parentXPath = null) =>
```
string.IsNullOrEmpty(parentXPath) && source.Parent == null && source.Document == null
```
```
? "/" // source is an element on the fly, not attached to any parent node.
```
```
: source.XPath(
```
```
parentXPath ?? source.Parent?.XPath(),
```
```
source.Name.XPath(source),
```

sibling => sibling.Name == source.Name);

There is a special case for element. As fore mentioned, an element can be constructed on the fly, and it is the root node of its XML tree. In this case, just outputs XPath root expression /. For other cases, just call above XPath extension method for XNode, with:

· XPath of parent element, if not provided then calculate recursively

· XPath of element name, which can be generated by calling above XPath extension method for XName

· A lambda expression to identify ambiguous sibling elements with the same element name, so that the proper XPath predicate can be generated

The XPath overloads for comment/text/processing instruction nodes are straightforward:

public static string XPath(this XComment source, string parentXPath = null) =>
```
source.XPath(parentXPath ?? source.Parent?.XPath(), "comment()");
```
```
public static string XPath(this XText source, string parentXPath = null) =>
```
```
source.XPath(parentXPath ?? source.Parent?.XPath(), "text()");
```
```
public static string XPath(this XProcessingInstruction source, string parentXPath = null) =>
```
```
source.XPath(
```
```
parentXPath ?? source.Parent?.XPath(),
```
```
$"processing-instruction('{source.Target}')",
```

sibling => string.Equals(sibling.Target, source.Target, StringComparison.Ordinal));

And the XPath overload for attribute just combine parent element’s XPath with the format of @attributeName:

public static string XPath(this XAttribute source, string parentXPath = null) =>

CombineXPath(parentXPath ?? source.Parent?.XPath(), $"@{source.Name.XPath(source.Parent)}");

Here are some examples of using these extension methods:

internal static void GenerateXPath()
```
{
```
```
XDocument aspNetRss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```
XElement element1 = aspNetRss
```
```
.Root
```
```
.Element("channel")
```
```
.Elements("item")
```
```
.Last();
```
```
element1.XPath().WriteLine(); // /rss/channel/item[20]
```
```
XElement element2 = aspNetRss.XPathSelectElement(element1.XPath());
```
```
object.ReferenceEquals(element1, element2).WriteLine(); // True
```
```
XDocument flickrRss = XDocument.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2");
```
```
XAttribute attribute1 = flickrRss
```
```
.Root
```
```
.Descendants("author") // <author flickr:profile="https://www.flickr.com/people/dixin/">...</author>.
```
```
.First()
```
```
.Attribute(XName.Get("profile", "urn:flickr:user")); // <rss xmlns:flickr="urn:flickr:user">...</rss>.
```
```
attribute1.XPath().WriteLine(); // /rss/channel/item[1]/author/@flickr:profile
```
```
XAttribute attribute2 = ((IEnumerable<object>)flickrRss
```
```
.XPathEvaluate(attribute1.XPath(), flickrRss.CreateNamespaceManager()))
```
```
.Cast<XAttribute>()
```
```
.Single();
```
```
object.ReferenceEquals(attribute1, attribute2).WriteLine(); // True
```

}