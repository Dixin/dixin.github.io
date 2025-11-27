---
title: "Lambda Calculus via C# (15) Encoding Church List with Church Pair, And Null"
published: 2018-11-15
description: "This part will demonstrate how to use lambda expressions to encode another data structure - list (Church list in  or [LinkedList<T>](http"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-5-list](/posts/lambda-calculus-via-csharp-5-list "https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-5-list")**

This part will demonstrate how to use lambda expressions to encode another data structure - list (Church list in [lambda calculus](http://en.wikipedia.org/wiki/Lambda_calculus) or [LinkedList<T>](https://msdn.microsoft.com/en-us/library/he2s3bh7.aspx) in .NET).

It is straightforward to represent a Church list node (or [LinkedListNode<T>](https://msdn.microsoft.com/en-us/library/ahf4c754.aspx) in .NET) with Church pair (2-tuple)

-   tuple’s Item1 will be the value of current node
-   tuple’s Item2 will be the next node, which is also another tuple of course.

## Church pair as a Church list node

Remember Church pair (called tuple here in order to align with .NET):
```
CreateTuple := λx.λy.λf.f x y
Tuple := λf.f x y
Item1 := λt.t (λx.λy.x)
Item2 := λt.t (λx.λy.y)
```

Directly for Church list node:
```
CreateListNode := CreateTuple ≡ λv.λn.λf.f v n
ListNode := Tuple ≡ λf.f v n
Value := Item1 ≡ λl.l (λv.λn.v)
Next := Item2 ≡ λl.l (λv.λn.n)
```

The C# code will be direct applications of the tuple’s functions:
```
// ListNode<T> is alias of Tuple<T, ListNode<T>>
public delegate object ListNode<out T>(Boolean<T, ListNode<T>> f);

public static class ChurchList
{
    // Create = value => next => ChurchTuple.Create(value)(next)
    public static Func<ListNode<T>, ListNode<T>> Create<T>
        (T value) => next => new ListNode<T>(ChurchTuple.Create<T, ListNode<T>>(value)(next));

    // Value = node => node.Item1()
    public static T Value<T>
        (this ListNode<T> node) => new Tuple<T, ListNode<T>>(node).Item1();

    // Next = node => node.Item2()
    public static ListNode<T> Next<T>
        (this ListNode<T> node) => new Tuple<T, ListNode<T>>(node).Item2();
}
```

## Encoding Null, and IsNull predicate

If a list has a end node, what’s its Next node, or as a tuple what’s its Item2? In C#/.NET, a [LinkedListNode<T>](https://msdn.microsoft.com/en-us/library/ahf4c754.aspx)’s Next property can be null to indicate the current node is the last element ([Last](https://msdn.microsoft.com/en-us/library/ms132188.aspx)) of the [LinkedList<T>](https://msdn.microsoft.com/en-us/library/he2s3bh7.aspx). In lambda calculus, Null and IsNull predicate for list node can be defined as:
```
Null := λf.λx.x
IsNull := λl.l (λv.λn.λx.False) True
```

When IsNull is applied with a null node:
```
IsNull Null
≡ (λl.l (λv.λn.λx.False) True) (λf.λx.x)
≡ (λf.λx.x) (λv.λn.λx.False) True
≡ (λx.x) True
≡ True
```

And when IsNull is applied with a non-null node:
```
IsNull (CreateListNode 0 Null)
≡ IsNull (λf.f 0 Null)
≡ (λl.l (λv.λn.λx.False) True) (λf.f 0 Null)
≡ (λf.f 0 Null) (λv.λn.λx.False) True
≡ (λv.λn.λx.False) 0 Null True
≡ (λn.λx.False) Null True
≡ (λx.False) True
≡ False
```

The C# implementation is noisy because a lot of type information has to be provided. This is Null:
```
// Null = f => _ => _;
public static object Null<T>
    (Boolean<T, ListNode<T>> f) => new Func<Boolean, Boolean>(_ => _);
```

and IsNull:
```
// IsNull = node(value => next => _ => ChurchBoolean.False)(ChurchBoolean.True)
public static Boolean IsNull<T>
    (this ListNode<T> node) =>
        ((Func<Boolean, Boolean>)node(value => next =>
            new Func<Boolean, Boolean>(_ => ChurchBoolean.False)))(ChurchBoolean.True);
```

### Church Boolean as Null

Actually, the definition of Null (λf.λx.x) is exactly the same as [False](/posts/lambda-calculus-via-c-sharp-4-encoding-church-booleans) (λf.λx.x) according to alpha-conversion, so it can be redefined as:
```
Null := False
```

C# will be:
```
// Null = ChurchBoolean.False;
public static ListNode<T> GetNull<T>
    () => ChurchBoolean.False<Boolean<T, ListNode<T>>, Boolean>;
```

Here a function GetNull has to be created, because C# does not support generic property.

And IsNull needs to be refactored too:
```
// IsNull = node => node(value => next => _ => ChurchBoolean.False)(ChurchBoolean.True)
public static Boolean IsNull<T>
    (this ListNode<T> node) => 
        (Boolean)((Func<Boolean, object>)node(value => next => 
            new Func<Boolean, object>(_ => 
                new Boolean(ChurchBoolean.False))))(ChurchBoolean.True);
```

Here object in the code does not mean that System.Object is introduced to implement IsNull. It is just used to satisfy c# compiler. So with the help of [Church pair](/posts/lambda-calculus-via-c-sharp-13-encoding-church-pairs-2-tuples-and-generic-church-booleans) and [Church Boolean](/posts/lambda-calculus-via-c-sharp-4-encoding-church-booleans), the Church list has been encoded with functions in lambda calculus, as well as null and IsNull predicate.

## The improved Next

Since Null is introduced, Next need to be redefined, so that a Null node’s next node will still be itself:
```
ListNodeNext := λl.If (IsNull l) (λx.l) (λx.(Item2 l))
```

Refactored C#:
```
// Next = node => If(node.IsNull())(_ => Null)(_ => node.Item2())
public static ListNode<T> Next<T>
    (this ListNode<T> node) =>
        ChurchBoolean.If<ListNode<T>>(node.IsNull())
            (_ => node)
            (_ => new Tuple<T, ListNode<T>>(node).Item2());
```

This is the same way as Church numerals, Decrease 0 is still 0.

## Index

With the improved Next, the Index function can be defined as:
```
Index = λl.λi.i Next l
```

To get the node of index I, just means to do “Next” I times, starting with the specified node.

C#:
```
// Index = start => index => index(Next)(start)
public static ListNode<T> Index<T>
    (this ListNode<T> start, _Numeral index) => index.Numeral<ListNode<T>>()(Next)(start);
```

## Unit tests

The following unit tests also shows how to use Church list:

```csharp
[TestClass()]
public class ChurchListTests
{
    [TestMethod()]
    public void CreateValueNextTest()
    {
        ListNode<int> node1 = ChurchList.Create(1)(ChurchList.Null);
        ListNode<int> node2 = ChurchList.Create(2)(node1);
        ListNode<int> node3 = ChurchList.Create(3)(node2);
        Assert.AreEqual(1, node1.Value());
        Assert.AreEqual(ChurchList.Null, node1.Next());
        Assert.AreEqual(2, node2.Value());
        Assert.AreEqual(node1, node2.Next());
        Assert.AreEqual(3, node3.Value());
        Assert.AreEqual(node2, node3.Next());
        Assert.IsTrue(ChurchList.GetNull<object>().Next().IsNull()._Unchurch());
    }

    [TestMethod()]
    public void NullIsNullTest()
    {
        ListNode<int> node = ChurchList.Create(1)(ChurchList.Null);
        Assert.IsTrue(ChurchList.IsNull<object>(ChurchList.Null)._Unchurch());
        Assert.IsTrue(ChurchList.GetNull<object>().IsNull()._Unchurch());
        Assert.IsTrue(new ListNode<object>(ChurchBoolean.False<Boolean<object, ListNode<object>>, Boolean>).IsNull()._Unchurch());
        Assert.IsFalse(node.IsNull()._Unchurch());
    }

    [TestMethod()]
    public void IndexTest()
    {
        ListNode<int> node1 = ChurchList.Create(1)(ChurchList.Null);
        ListNode<int> node2 = ChurchList.Create(2)(node1);
        ListNode<int> node3 = ChurchList.Create(3)(node2);
        Assert.AreEqual(node3, node3.Index(0U._Church()));
        Assert.AreEqual(node2, node3.Index(1U._Church()));
        Assert.AreEqual(node1, node3.Index(2U._Church()));
        Assert.IsTrue(node3.Index(3U._Church()).IsNull()._Unchurch());
        Assert.IsTrue(node3.Index(4U._Church()).IsNull()._Unchurch());
        Assert.IsTrue(node3.Index(5U._Church()).IsNull()._Unchurch());
    }
}
```