---
title: "LINQ to XML in Depth (2) Query Methods (Operators)"
published: 2019-08-16
description: "As fore mentioned, LINQ to XML is just a specialized LINQ to Objects, so all the LINQ to Objects queries can be used in LINQ to XML queries. LINQ to XML provides many additional functions and queries"
image: ""
tags: [".NET", "C#", "LINQ", "LINQ to XML", "LINQ via C#", "XML"]
category: ".NET"
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

```csharp
{
```
```csharp
XElement element = new XElement("element");
```
```csharp
XDocument document = new XDocument(new XElement("grandparent", new XElement("parent", element)));
```

```csharp
element.Parent.Name.WriteLine(); // parent
```
```csharp
element
```
```csharp
.Ancestors()
```
```csharp
.Select(ancestor => ancestor.Name)
```
```csharp
.WriteLines(); // parent grandparent
```
```csharp
element
```
```csharp
.AncestorsAndSelf()
```
```csharp
.Select(selfOrAncestor => selfOrAncestor.Name)
```
```csharp
.WriteLines(); // element parent grandparent
```
```csharp
object.ReferenceEquals(element.Ancestors().Last(), element.Document.Root).WriteLine(); // True.
```

}

Notice AncestorsAndSelf first yields self, then yields ancestors recursively. It could be more intuitive if named as SelfAndAncestors.

The following example queries direct child elements. In RSS feed, each <item> can have 0, 1, or multiple tags. And these tags are <category> elements under each <item> element. The following code queries a given RSS feed to get the items with a permalink, then queries the top 5 tags used by these items:

internal static void ChildElements()

```csharp
{
```
```csharp
XDocument rss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```csharp
IEnumerable<string>categories = rss
```
```csharp
.Root // <rss>.
```
```csharp
.Element("channel") // Single< channel> under <rss>.
```
```csharp
.Elements("item") // All< item>s under single <channel>.
```
```csharp
.Where(item => (bool)item
```
```csharp
.Element("guid") // Single <guid> under each <item>
```
```csharp
.Attribute("isPermaLink")) // isPermaLink attribute of <guid>.
```
```csharp
.Elements("category") // All <category>s under all <item>s.
```
```csharp
.GroupBy(
```
```csharp
keySelector: category => (string)category, // String value of each <category>.
```
```csharp
elementSelector: category => category,
```
```csharp
resultSelector: (key, group) => new { Name = key, Count = group.Count() },
```
```csharp
comparer: StringComparer.OrdinalIgnoreCase)
```
```csharp
.OrderByDescending(category => category.Count)
```
```csharp
.Take(5)
```
```csharp
.Select(category => $"[{category.Name}]:{category.Count}");
```
```csharp
string.Join(" ", categories).WriteLine();
```
```csharp
// [C#]:9 [LINQ]:6 [.NET]:5 [Functional Programming]:4 [LINQ via C#]:4
```

}

Similar to ancestors, descendants are children, children’s children, …, recursively:

internal static void ChildrenAndDescendants()

```csharp
{
```
```csharp
XElement root = XElement.Parse(@"
```
```csharp
<root>
```
```csharp
<![CDATA[cdata]]>0<!--Comment-->
```
```csharp
<element>1</element>
```
```csharp
<element>2<element>3</element></element>
```
```csharp
</root>");
```

```csharp
root.Elements()
```
```csharp
.WriteLines(element => element.ToString(SaveOptions.DisableFormatting));
```
```csharp
// <element>1</element>
```
```csharp
// < element>2<element>3</element></element>
```

```csharp
root.Nodes()
```
```csharp
.WriteLines(node => $"{node.NodeType}: {node.ToString(SaveOptions.DisableFormatting)}");
```
```csharp
// CDATA: <![CDATA[cdata]]>
```
```csharp
// Text: 0
```
```csharp
// Comment: <!--Comment-->
```
```csharp
// Element: < element>1</element>
```
```csharp
// Element: <element>2<element>3</element></element>
```

```csharp
root.Descendants()
```
```csharp
.WriteLines(element => element.ToString(SaveOptions.DisableFormatting));
```
```csharp
// <element>1</element>
```
```csharp
// < element>2<element>3</element></element>
```
```csharp
// <element>3</element>
```

```csharp
root.DescendantNodes()
```
```csharp
.WriteLines(node => $"{node.NodeType}: {node.ToString(SaveOptions.DisableFormatting)}");
```
```csharp
// CDATA: <![CDATA[cdata]]>
```
```csharp
// Text: 0
```
```csharp
// Comment: <!--Comment-->
```
```csharp
// Element: < element>1</element>
```
```csharp
// Text: 1
```
```csharp
// Element: < element>2<element>3</element></element>
```
```csharp
// Text: 2
```
```csharp
// Element: < element>3</element>
```
```csharp
// Text: 3
```

}

Regarding all the X\* types are reference types, when querying the same XML tree, multiple queries’ results from the same source tree can reference to the same instance:

internal static void ResultReferences()

```csharp
{
```
```csharp
XDocument rss1 = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```csharp
XElement[] items1 = rss1.Descendants("item").ToArray();
```
```csharp
XElement[] items2 = rss1.Element("rss").Element("channel").Elements("item").ToArray();
```
```csharp
object.ReferenceEquals(items1.First(), items2.First()).WriteLine(); // True
```
```csharp
items1.SequenceEqual(items2).WriteLine(); // True
```

```csharp
XDocument rss2 = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```csharp
XElement[] items3 = rss2.Root.Descendants("item").ToArray();
```
```csharp
object.ReferenceEquals(items1.First(), items3.First()).WriteLine(); // False
```
```csharp
items1.SequenceEqual(items3).WriteLine(); // False
```

}

Again, LINQ to XML is just a specialized LINQ to Objects. For example, the implementation of XNode.Ancestors is equivalent to:

namespace System.Xml.Linq

```csharp
{
```
```csharp
public abstract class XNode : XObject
```
```csharp
{
```
```csharp
public IEnumerable<XElement> Ancestors()
```
```csharp
{
```
```csharp
for (XElement parent = this.Parent; parent != null; parent = parent.Parent)
```
```csharp
{
```
```csharp
yield return parent;
```
```csharp
}
```
```csharp
}
```

```csharp
// Other members.
```
```csharp
}
```

}

And the implementation of the Extensions.Ancestors query is equivalent to:

namespace System.Xml.Linq

```csharp
{
```
```csharp
public static partial class Extensions
```
```csharp
{
```
```csharp
public static IEnumerable<XElement> Ancestors<T>(this IEnumerable<T> source) where T : XNode =>
```
```csharp
source
```
```csharp
.Where(node => node != null)
```
```csharp
.SelectMany(node => node.Ancestors())
```

```csharp
// Other members.
```
```csharp
}
```

}

### Ordering

Besides the LINQ to Objects ordering queries, additional ordering queries are provided by LINQ to XML. The InDocumentOrder query orders nodes by their positions in the XML tree, from top node down. For example, above Ancestors yields parent, parent’s parent, …, recursively. InDocumentOrder can reorder them from top down. As a result, the query result is reversed:

internal static void DocumentOrder()

```csharp
{
```
```csharp
XElement element1 = new XElement("element");
```
```csharp
XElement element2 = new XElement("element");
```
```csharp
XDocument document = new XDocument(new XElement("grandparent", new XElement("parent", element1, element2)));
```

```csharp
element1.IsBefore(element2).WriteLine(); // True
```
```csharp
XNode.DocumentOrderComparer.Compare(element1, element2).WriteLine(); // -1
```

```csharp
XElement[] ancestors = element1.Ancestors().ToArray();
```
```csharp
XNode.CompareDocumentOrder(ancestors.First(), ancestors.Last()).WriteLine(); // 1
```
```csharp
ancestors
```
```csharp
.InDocumentOrder()
```
```csharp
.Select(ancestor => ancestor.Name)
```
```csharp
.WriteLines(); // grandparent parent
```

```csharp
element1
```
```csharp
.AncestorsAndSelf()
```
```csharp
.Reverse()
```
```csharp
.SequenceEqual(element1.AncestorsAndSelf().InDocumentOrder())
```
```csharp
.WriteLine(); // True
```

}

Apparently, InDocumentOrder requires the source nodes sequence to be in the same XML tree. This is determined by looking up a common ancestor of the source nodes:

internal static void CommonAncestor()

```csharp
{
```
```csharp
XElement root = XElement.Parse(@"
```
```csharp
<root>
```
```csharp
<element value='4' />
```
```csharp
<element value='2' />
```
```csharp
<element value='3'><element value='1' /></element>
```
```csharp
</root>");
```
```csharp
XElement[] elements = root
```
```csharp
.Descendants("element")
```
```csharp
.OrderBy(element => (int)element.Attribute("value")).ToArray();
```
```csharp
elements.WriteLines(ancestorOrSelf => ancestorOrSelf.ToString(SaveOptions.DisableFormatting));
```
```csharp
// <element value="1" />
```
```csharp
// <element value="2" />
```
```csharp
// <element value="3"><element value="1" /></element>
```
```csharp
// <element value="4" />
```

```csharp
new XElement[] { elements.First(), elements.Last() }
```
```csharp
.InDocumentOrder()
```
```csharp
.WriteLines(ancestorOrSelf => ancestorOrSelf.ToString(SaveOptions.DisableFormatting));
```
```csharp
// <element value="4" />
```
```csharp
// <element value="1" />
```

```csharp
new XElement[] { elements.First(), elements.Last(), new XElement("element") }
```
```csharp
.InDocumentOrder()
```
```csharp
.WriteLines();
```
```csharp
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

```csharp
{
```
```csharp
public static IEnumerable<T> InDocumentOrder<T>(this IEnumerable<T> source) where T : XNode =>
```
```csharp
source.OrderBy(node => node, XNode.DocumentOrderComparer);
```

}

## More useful custom queries

With the knowledge of LINQ to Objects and LINQ to XML APIs, more useful queries can be implemented. For example, the following DescendantObjects queries an XObject source’s all descendant XObject instances:

public static partial class XExtensions

```csharp
{
```
```csharp
public static IEnumerable<XObject> DescendantObjects(this XObject source) =>
```
```csharp
Enumerable
```
```csharp
.Empty<XObject>()
```
```csharp
.Concat(
```
```csharp
source is XElement element
```
```csharp
? element.Attributes() // T is covariant in IEnumerable<T>.
```
```csharp
: Enumerable.Empty<XObject>())
```
```csharp
.Concat(
```
```csharp
source is XContainer container
```
```csharp
? container
```
```csharp
.DescendantNodes()
```
```csharp
.SelectMany(descendant => EnumerableEx
```
```csharp
.Return(descendant)
```
```csharp
.Concat(
```
```csharp
descendant is XElement descendantElement
```
```csharp
? descendantElement.Attributes() // T is covariant in IEnumerable<T>.
```
```csharp
: Enumerable.Empty<XObject>()))
```
```csharp
: Enumerable.Empty<XObject>());
```

}

As fore mentioned, XObject can be either node or attribute. So, in the query, If the source is element, it yields the element’s attributes; if the source is XContainer, it yields each descendant node; If a descendant node is element, it yields the attributes.

The following SelfAndDescendantObjects query is intuitive by name and straightforward to implement:

public static IEnumerable<XObject\> SelfAndDescendantObjects(this XObject source) =>

```csharp
EnumerableEx
```
```csharp
.Return(source)
```

.Concat(source.DescendantObjects());

The following Names query finds a XContainer source for all elements’ and attributes’ names:

public static IEnumerable<XName\> Names(this XContainer source) =>

```csharp
(source is XElement element
```
```csharp
? element.DescendantsAndSelf()
```
```csharp
: source.Descendants())
```
```csharp
.SelectMany(descendantElement => EnumerableEx
```
```csharp
.Return(descendantElement.Name)
```
```csharp
.Concat(descendantElement
```
```csharp
.Attributes()
```
```csharp
.Select(attribute => attribute.Name)))
```

.Distinct();

As fore mentioned, XName instances are cached, so Distinct is called to remove the duplicated references.

Above built-in Attributes query finds an element’s attributes. The following AllAttributes queries an XContainer source’s attributes (if it is an element) and all its descendant elements’ attributes:

public static IEnumerable<XAttribute\> AllAttributes(this XContainer source) =>

```csharp
(source is XElement element
```
```csharp
? element.DescendantsAndSelf()
```
```csharp
: source.Descendants())
```

.SelectMany(elementOrDescendant => elementOrDescendant.Attributes());

The following Namespaces query finds all namespaces defined in a XContainer source:

public static IEnumerable<(string, XNamespace)> Namespaces(this XContainer source) =>

```csharp
source // Namespaces are defined as xmlns:prefix="namespace" attributes.
```
```csharp
.AllAttributes()
```
```csharp
.Where(attribute => attribute.IsNamespaceDeclaration)
```

.Select(attribute => (attribute.Name.LocalName, (XNamespace)attribute.Value));

It outputs a sequence of (prefix, namespace) tuples, which is very handy. With its help, the following function can be defined to create XmlNamespaceManager from any XContainer source:

public static XmlNamespaceManager CreateNamespaceManager(this XContainer source)

```csharp
{
```
```csharp
XmlNamespaceManager namespaceManager = new XmlNamespaceManager(new NameTable());
```
```csharp
source
```
```csharp
.Namespaces()
```
```csharp
.ForEach(@namespace => namespaceManager.AddNamespace(@namespace.Item1, @namespace.Item2.ToString()));
```
```csharp
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

```csharp
{
```
```csharp
XDocument rss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```csharp
XPathNavigator rssNavigator = rss.CreateNavigator();
```
```csharp
rssNavigator.NodeType.WriteLine(); // Root
```
```csharp
rssNavigator.MoveToFirstChild().WriteLine(); // True
```
```csharp
rssNavigator.Name.WriteLine(); // rss
```

```csharp
((XPathNodeIterator)rssNavigator
```
```csharp
.Evaluate("/rss/channel/item[guid/@isPermaLink='true']/category"))
```
```csharp
.Cast<XPathNavigator>()
```
```csharp
.Select(categoryNavigator => categoryNavigator.UnderlyingObject)
```
```csharp
.Cast<XElement>()
```
```csharp
.GroupBy(
```
```csharp
category => category.Value, // Current text node's value.
```
```csharp
category => category,
```
```csharp
(key, group) => new { Name = key, Count = group.Count() },
```
```csharp
StringComparer.OrdinalIgnoreCase)
```
```csharp
.OrderByDescending(category => category.Count)
```
```csharp
.Take(5)
```
```csharp
.Select(category => $"[{category.Name}]:{category.Count}")
```
```csharp
.WriteLines();
```
```csharp
// [C#]:9 [LINQ]:6 [.NET]:5 [Functional Programming]:4 [LINQ via C#]:4
```

}

It implements the same query as previous RSS tags example.

The XPathSelectElements method is a shortcut of calling CreateNavigator to get an XPathNavigator and then call Evaluate. The above query can be shortened as:

internal static void XPathQuery()

```csharp
{
```
```csharp
XDocument rss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```csharp
rss
```
```csharp
.XPathSelectElements("/rss/channel/item[guid/@isPermaLink='true']/category")
```
```csharp
.GroupBy(
```
```csharp
category => category.Value, // Current text node's value.
```
```csharp
category => category,
```
```csharp
(key, group) => new { Name = key, Count = group.Count() },
```
```csharp
StringComparer.OrdinalIgnoreCase)
```
```csharp
.OrderByDescending(category => category.Count)
```
```csharp
.Take(5)
```
```csharp
.Select(category => $"[{category.Name}]:{category.Count}")
```
```csharp
.WriteLines();
```
```csharp
// [C#]:9 [LINQ]:6 [.NET]:5 [Functional Programming]:4 [LINQ via C#]:4
```

}

And XPathSelectElement is simply a shortcut of calling XPathSelectElements to get a sequence, then call FirstOrDefault.

XPathEvaluate also calls CreateNavigator and then Evaluate, but it is more flexible. When the XPath is evaluated to a single value, it just returns that value. The following example queries the RSS feed for the average tags count of each <item> element, and also the equivalent LINQ query:

internal static void XPathEvaluateValue()

```csharp
{
```
```csharp
XDocument rss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```csharp
double average1 = (double)rss.XPathEvaluate("count(/rss/channel/item/category) div count(/rss/channel/item)");
```
```csharp
average1.WriteLine(); // 4.65
```

```csharp
double average2 = rss
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
.Average(item => item.Elements("category").Count());
```
```csharp
average2.WriteLine(); // 4.65
```

}

When the XPath is evaluated to a sequence of values, XPathEvaluate outputs IEnumerable<object>:

internal static void XPathEvaluateSequence()

```csharp
{
```
```csharp
XDocument rss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```csharp
((IEnumerable<object>)rss
```
```csharp
.XPathEvaluate("/rss/channel/item[guid/@isPermaLink='true']/category/text()"))
```
```csharp
.Cast<XText>()
```
```csharp
.GroupBy(
```
```csharp
categoryTextNode => categoryTextNode.Value, // Current text node's value.
```
```csharp
categoryTextNode => categoryTextNode,
```
```csharp
(key, group) => new { Name = key, Count = group.Count() },
```
```csharp
StringComparer.OrdinalIgnoreCase)
```
```csharp
.OrderByDescending(category => category.Count)
```
```csharp
.Take(5)
```
```csharp
.Select(category => $"[{category.Name}]:{category.Count}")
```
```csharp
.WriteLines();
```
```csharp
// [C#]:9 [LINQ]:6 [.NET]:5 [Functional Programming]:4 [LINQ via C#]:4
```

}

LINQ to XML also provides overloads for these XPath methods to accept an IXmlNamespaceResolver parameter. When the XPath expression involves namespace, an IXmlNamespaceResolver instance must be provided. Taking another RSS feed from Flickr as an example:

<?xml version\="1.0" encoding\="utf-8"?>

```csharp
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:flickr="urn:flickr:user">
```
```csharp
<channel>
```
```csharp
<item>
```
```csharp
<title>Microsoft Way, Microsoft Campus</title>
```
```csharp
<dc:date.Taken>2011-11-02T16:45:54-08:00</dc:date.Taken>
```
```csharp
<author flickr:profile="https://www.flickr.com/people/dixin/">nobody@flickr.com (Dixin Yan)</author>
```
```csharp
<media:content url="https://farm3.staticflickr.com/2875/9215169916_f8fa57c3da_b.jpg" type="image/jpeg" height="681" width="1024"/>
```
```csharp
<media:title>Microsoft Way, Microsoft Campus</media:title>
```
```csharp
<media:description type="html">
```
```csharp
<p>Microsoft Campus is the informal name of Microsoft's corporate headquarters, located at One Microsoft Way in Redmond, Washington. Microsoft initially moved onto the grounds of the campus on February 26, 1986. <a href="http://en.wikipedia.org/wiki/Microsoft_Redmond_Campus" rel="nofollow">en.wikipedia.org/wiki/Microsoft_Redmond_Campus</a></p>
```
```csharp
</media:description>
```
```csharp
<media:thumbnail url="https://farm3.staticflickr.com/2875/9215169916_f8fa57c3da_s.jpg" height="75" width="75"/>
```
```csharp
<media:credit role="photographer">Dixin Yan</media:credit>
```
```csharp
<media:category scheme="urn:flickr:tags">microsoft</media:category>
```
```csharp
<!-- Other elements. -->
```
```csharp
</item>
```
```csharp
<!-- Other items. -->
```
```csharp
</channel>
```

</rss\>

It contains additional information than the standard RSS format, and these additional elements/attributes are managed by namespaces. The following example calls the overload of XPathSelectElements to query the <media:category> elements:

internal static void XPathQueryWithNamespace()

```csharp
{
```
```csharp
XDocument rss = XDocument.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2");
```
```csharp
XmlNamespaceManager namespaceManager = rss.CreateNamespaceManager();
```
```csharp
IEnumerable<XElement>query1 = rss.XPathSelectElements("/rss/channel/item/media:category", namespaceManager);
```
```csharp
query1.Count().WriteLine(); // 20
```

```csharp
IEnumerable<XElement> query2 = rss.XPathSelectElements("/rss/channel/item/media:category");
```
```csharp
// XPathException: Namespace Manager or XsltContext needed. This query has a prefix, variable, or user-defined function.
```

}

Since prefix “media” is in XPath expression, An IXmlNamespaceResolver instance is required. XmlNamespaceManager implements IXmlNamespaceResolver, so simply call the previously defined CreateNamespaceManager method to create it. In contrast, querying the same XPath expression without IXmlNamespaceResolver instance throws XPathException.

The last example calls the overload of XPathEvaluate to query the items’ titles, which has the tag “microsoft” in the< media:category> element:

internal static void XPathEvaluateSequenceWithNamespace()

```csharp
{
```
```csharp
XDocument rss = XDocument.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2");
```
```csharp
((IEnumerable<object>)rss
```
```csharp
.XPathEvaluate(
```
```csharp
"/rss/channel/item[contains(media:category/text(), 'microsoft')]/media:title/text()",
```
```csharp
rss.CreateNamespaceManager()))
```
```csharp
.Cast<XText>()
```
```csharp
.WriteLines(mediaTitle => mediaTitle.Value);
```
```csharp
// Chinese President visits Microsoft
```
```csharp
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

```csharp
{
```
```csharp
string prefix = source.Namespace == XNamespace.None
```
```csharp
? null
```
```csharp
: container.GetPrefixOfNamespace(source.Namespace); // GetPrefixOfNamespace returns null if not found.
```
```csharp
return string.IsNullOrEmpty(prefix) ? source.ToString() : $"{prefix}:{source.LocalName}";
```

}

Regarding the above segment 1 and segment 2 has to be combined, another helper function is needed to combine 2 XPath expressions, which is similar to .NET built-in Combine method provided by System.IO.Path:

private static string CombineXPath(string xPath1, string xPath2, string predicate = null) =>

```csharp
string.Equals(xPath1, "/", StringComparison.Ordinal) || string.IsNullOrEmpty(xPath2)
```
```csharp
? $"{xPath1}{xPath2}{predicate}"
```

: $"{xPath1}/{xPath2}{predicate}";

Regarding XObject can be either one type of attribute, or several types of nodes, apparently attribute does not need the position predicate, while the different types of nodes all share similar logic to identify the position and the ambiguous siblings. So, the following helper function can be defined for XNode:

private static string XPath<TSource\>(

```csharp
this TSource source,
```
```csharp
string parentXPath,
```
```csharp
string selfXPath = null,
```
```csharp
Func<TSource, bool> siblingPredicate = null) where TSource : XNode
```
```csharp
{
```
```csharp
int index = source
```
```csharp
.NodesBeforeSelf()
```
```csharp
.Cast<TSource>()
```
```csharp
.Where(siblingPredicate ?? (_ => true))
```
```csharp
.Count();
```
```csharp
string predicate = index == 0
```
```csharp
&& !source
```
```csharp
.NodesAfterSelf()
```
```csharp
.Cast<TSource>()
```
```csharp
.Where(siblingPredicate ?? (_ => true))
```
```csharp
.Any()
```
```csharp
? null
```
```csharp
: $"[{index + 1}]";
```
```csharp
return CombineXPath(parentXPath, selfXPath, predicate);
```

}

Now, the following XPath extension method can be defined to generate XPath expression for an element:

public static string XPath(this XElement source, string parentXPath = null) =>

```csharp
string.IsNullOrEmpty(parentXPath) && source.Parent == null && source.Document == null
```
```csharp
? "/" // source is an element on the fly, not attached to any parent node.
```
```csharp
: source.XPath(
```
```csharp
parentXPath ?? source.Parent?.XPath(),
```
```csharp
source.Name.XPath(source),
```

sibling => sibling.Name == source.Name);

There is a special case for element. As fore mentioned, an element can be constructed on the fly, and it is the root node of its XML tree. In this case, just outputs XPath root expression /. For other cases, just call above XPath extension method for XNode, with:

· XPath of parent element, if not provided then calculate recursively

· XPath of element name, which can be generated by calling above XPath extension method for XName

· A lambda expression to identify ambiguous sibling elements with the same element name, so that the proper XPath predicate can be generated

The XPath overloads for comment/text/processing instruction nodes are straightforward:

public static string XPath(this XComment source, string parentXPath = null) =>

```csharp
source.XPath(parentXPath ?? source.Parent?.XPath(), "comment()");
```

```csharp
public static string XPath(this XText source, string parentXPath = null) =>
```
```csharp
source.XPath(parentXPath ?? source.Parent?.XPath(), "text()");
```

```csharp
public static string XPath(this XProcessingInstruction source, string parentXPath = null) =>
```
```csharp
source.XPath(
```
```csharp
parentXPath ?? source.Parent?.XPath(),
```
```csharp
$"processing-instruction('{source.Target}')",
```

sibling => string.Equals(sibling.Target, source.Target, StringComparison.Ordinal));

And the XPath overload for attribute just combine parent element’s XPath with the format of @attributeName:

public static string XPath(this XAttribute source, string parentXPath = null) =>

CombineXPath(parentXPath ?? source.Parent?.XPath(), $"@{source.Name.XPath(source.Parent)}");

Here are some examples of using these extension methods:

internal static void GenerateXPath()

```csharp
{
```
```csharp
XDocument aspNetRss = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```csharp
XElement element1 = aspNetRss
```
```csharp
.Root
```
```csharp
.Element("channel")
```
```csharp
.Elements("item")
```
```csharp
.Last();
```
```csharp
element1.XPath().WriteLine(); // /rss/channel/item[20]
```
```csharp
XElement element2 = aspNetRss.XPathSelectElement(element1.XPath());
```
```csharp
object.ReferenceEquals(element1, element2).WriteLine(); // True
```

```csharp
XDocument flickrRss = XDocument.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2");
```
```csharp
XAttribute attribute1 = flickrRss
```
```csharp
.Root
```
```csharp
.Descendants("author") // <author flickr:profile="https://www.flickr.com/people/dixin/">...</author>.
```
```csharp
.First()
```
```csharp
.Attribute(XName.Get("profile", "urn:flickr:user")); // <rss xmlns:flickr="urn:flickr:user">...</rss>.
```
```csharp
attribute1.XPath().WriteLine(); // /rss/channel/item[1]/author/@flickr:profile
```
```csharp
XAttribute attribute2 = ((IEnumerable<object>)flickrRss
```
```csharp
.XPathEvaluate(attribute1.XPath(), flickrRss.CreateNamespaceManager()))
```
```csharp
.Cast<XAttribute>()
```
```csharp
.Single();
```
```csharp
object.ReferenceEquals(attribute1, attribute2).WriteLine(); // True
```

}