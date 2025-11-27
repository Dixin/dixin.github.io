---
title: "Lambda Calculus via C# (16) Encoding Church List with 2 Church Pairs as a Node"
published: 2018-11-16
description: "Previous part encoded Church list with one  (2-tuple) as a list node. An alternative way"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-5-list](/posts/lambda-calculus-via-csharp-5-list "https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-5-list")**

Previous part encoded Church list with one [Church pair](/posts/lambda-calculus-via-c-sharp-13-encoding-church-pairs-2-tuples-and-generic-church-booleans) (2-tuple) as a list node. An alternative way is to use 2 tuples as a node, one wrapping the other.

-   Outer tuple’s Item1 will be the null flag (a Church Boolean value to indicate this node is null or not)
-   Outer tuple’s Item2 is the inner tuple:
    -   Inner tuple’s Item1 is the value of this node
    -   Inner tuple’s Item2 is the next node

## IsNull and Null

Above definition can immediately have:

```csharp
IsNull2 = λl.(Item1 l)
```

So Null is easy to be defined to:

```csharp
Null2 = λf.True
```

just returns True no matter what, which also guarantees above IsNull works.

C#:

```csharp
// ListNode2 is the alias of Tuple<Boolean, Tuple<T, ListNode2<T>>>
public delegate object ListNode2<out T>(Boolean<Boolean, Tuple<T, ListNode2<T>>> f);

public static partial class ChurchList2
{
    // Null = f => ChurchBoolean.True
    public static object Null<T>
        (Boolean<Boolean, Tuple<T, ListNode2<T>>> f) => new Boolean(ChurchBoolean.True);

    // IsNull = node => node.Item1()
    public static Boolean IsNull<T>
        (this ListNode2<T> node) => new Tuple<Boolean, Tuple<T, ListNode2<T>>>(node).Item1();
}
```

## Create, Value, and Next

Again from to above definitions:

```csharp
CreateListNode2 = λv.λn.CreateTuple False (CreateTuple v n)
Value2 = λl.Item1 (Item2 l)
Next2 = λl.If (IsNull2 l) (λx.l) (λx.(Item2 (Item2 l)))
```

Next uses If again to return Null as its next node, the same as previous Church list implemented by 1 Church pair for each node.

C#:

```csharp
public static partial class ChurchList2
{
    // Create = value => next => ChurchTuple.Create(ChurchBoolean.False)(ChurchTuple.Create(value)(next))
    public static Func<ListNode2<T>, ListNode2<T>> Create<T>
        (T value) => next =>
            new ListNode2<T>(ChurchTuple.Create<Boolean, Tuple<T, ListNode2<T>>>
                (ChurchBoolean.False)
                (ChurchTuple.Create<T, ListNode2<T>>(value)(next)));

    // Value = node => node.Item2().Item1()
    public static T Value<T>
        (this ListNode2<T> node) => new Tuple<Boolean, Tuple<T, ListNode2<T>>>(node).Item2().Item1();

    // Next = node => ChurchBoolean.If(node.IsNull())(_ => node)(_ => node.Item2().Item2())
    public static ListNode2<T> Next<T>
        (this ListNode2<T> node) =>
            ChurchBoolean.If<ListNode2<T>>(node.IsNull())
                (_ => node)
                (_ => new Tuple<Boolean, Tuple<T, ListNode2<T>>>(node).Item2().Item2());
}
```

## Index

The same as previous part as well:

```csharp
Index2 = λl.λi.i Next2 l
```

C#:

```csharp
public static partial class ChurchList2
{
    // Index = start => index = index(Next)(start)
    public static ListNode2<T> Index<T>
        (this ListNode2<T> start, _Numeral index) => index.Numeral<ListNode2<T>>()(Next)(start);
}
```

## Unit tests

Again, the same thing as previous part:

```csharp
[TestClass()]
public class ChurchList2Tests
{
    [TestMethod()]
    public void CreateValueNextTest()
    {
        ListNode2<int> node1 = ChurchList2.Create(1)(ChurchList2.Null);
        ListNode2<int> node2 = ChurchList2.Create(2)(node1);
        ListNode2<int> node3 = ChurchList2.Create(3)(node2);
        Assert.AreEqual(1, node1.Value());
        Assert.AreEqual(ChurchList2.Null, node1.Next());
        Assert.AreEqual(2, node2.Value());
        Assert.AreEqual(node1, node2.Next());
        Assert.AreEqual(3, node3.Value());
        Assert.AreEqual(node2, node3.Next());
        Assert.IsTrue(new ListNode2<object>(ChurchList2.Null).Next().IsNull()._Unchurch());
    }

    [TestMethod()]
    public void NullIsNullTest()
    {
        ListNode2<int> node = ChurchList2.Create(1)(ChurchList2.Null);
        Assert.IsTrue(ChurchList2.IsNull<object>(ChurchList2.Null)._Unchurch());
        Assert.IsFalse(node.IsNull()._Unchurch());
    }

    [TestMethod()]
    public void IndexTest()
    {
        ListNode2<int> node1 = ChurchList2.Create(1)(ChurchList2.Null);
        ListNode2<int> node2 = ChurchList2.Create(2)(node1);
        ListNode2<int> node3 = ChurchList2.Create(3)(node2);
        Assert.AreEqual(node3, node3.Index(0U._Church()));
        Assert.AreEqual(node2, node3.Index(1U._Church()));
        Assert.AreEqual(node1, node3.Index(2U._Church()));
        Assert.IsTrue(node3.Index(3U._Church()).IsNull()._Unchurch());
        Assert.IsTrue(node3.Index(4U._Church()).IsNull()._Unchurch());
        Assert.IsTrue(node3.Index(5U._Church()).IsNull()._Unchurch());
    }
}
```