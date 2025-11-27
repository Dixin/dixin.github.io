---
title: "Lambda Calculus via C# (17) Encoding Church List with Fold (Aggregate) Function"
published: 2018-11-17
description: "A third way to encode Church list, is to use ) (also called [aggregate in C#/.NET](https://msdn.microsoft.com/en-us/library/v"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-5-list](/posts/lambda-calculus-via-csharp-5-list "https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-5-list")**

A third way to encode Church list, is to use [fold function](http://en.wikipedia.org/wiki/Fold_\(higher-order_function\)) (also called [aggregate in C#/.NET](https://msdn.microsoft.com/en-us/library/vstudio/bb549218.aspx)):

```csharp
CreateListNode3 = λv.λn.λf.λx.f v (n f x)
Null3 = λf.λx.x
IsNull3 = λl.l (λv.λx.False) True
Value3 = λl.λx.l (λv.λy.v) x
Next3 = λl.Item2 (l (λv.λt.Shift (CreateListNode3 v)) (CreateTuple Null3 Null3))
Index3 = λl.λi.i Next3 l
```

## ListNode and wrapper

According to the definition, this is the ListNode in C#:

```csharp
// Curried from TResult ListNode<out T, TResult>(Func<T, TResult, TResult> f, TResult x)
public delegate Func<TAccumulate, TAccumulate> ListNode<out T, TAccumulate>(Func<TAccumulate, Func<T, TAccumulate>> f);
// ListNode is the alias of: Func<Func<T, Func<TResult, TResult>>, Func<TResult, TResult>>
```

f is the fold/aggregate function. In .NET aggregate function is a Func<TAccumulate, T, TAccumulate>, here in [lambda calculus](http://en.wikipedia.org/wiki/Lambda_calculus) it is curried to Func<TAccumulate, Func<T, TAccumulate>.

Just like the Church numeral wrapper \_Numeral, a wrapper is needed to hide TAccumulate “inside”:

```csharp
public partial class _ListNode<T>
{
    private readonly T value;

    protected virtual _ListNode<T> Next { get; set; }

    public _ListNode(T value, _ListNode<T> next)
    {
        this.value = value;
        this.Next = next;
    }

    public virtual ListNode<T, TAccumulate> Node<TAccumulate>
        () => 
            f => x => f(this.Next.Node<TAccumulate>()(f)(x))(this.value);
}
```

Again, class name is tagged with underscore since class is C# specific.

Null is a special case, so, exactly the same way how 0 is handled in Church numeral:

```csharp
public partial class _ListNode<T>
{
    private _ListNode()
    {
    }

    private class _NullListNode : _ListNode<T>
    {
        protected override _ListNode<T> Next { get { return this; } set { } }

        public override ListNode<T, TAccumulate> Node<TAccumulate>
            () => 
                f => x => x;
    }

    public static _ListNode<T> Null { get; } = new _NullListNode();
}
```

## IsNull

Null is \_ListNode<T>.Null, so IsNull function is easy to implement:

```csharp
public static partial class _ListNodeExtensions
{
    // IsNull = node => node(value => _ => ChurchBoolean.False)(ChurchBoolean.True)
    public static Boolean IsNull<T>
        (this _ListNode<T> node) =>
            node.Node<Boolean>()(value => _ => ChurchBoolean.False)(ChurchBoolean.True);
}
```

IsNull predicate is similar to the IsNull of Church list encoded with 1 tuple as each node.

## Create, value and Next

```csharp
public static partial class _ListNodeExtensions
{
    // Create = value => next => f => x => f(value)(next(f)(x))
    public static Func<_ListNode<T>, _ListNode<T>> Create<T>
        (T value) => next => new _ListNode<T>(value, next);
// Value = node => anyValueToIgnore => node(value => _ => value)(anyValueToIgnore)
    public static T Value<T>
        (this _ListNode<T> node, T anyValueToIgnore = default(T)) =>
            node.Node<T>()(_ => value => value)(anyValueToIgnore);

    // Next = node => node(value => tuple => tuple.Shift(Create(value)))(ChurchTuple.Create(Null)(Null)).Item1()
    public static _ListNode<T> Next<T>
        (this _ListNode<T> node) =>
            node.Node<Tuple<_ListNode<T>, _ListNode<T>>>()
                (tuple => value => tuple.Shift(Create(value)))
                (ChurchTuple.Create<_ListNode<T>, _ListNode<T>>(_ListNode<T>.Null)(_ListNode<T>.Null))
                .Item1();
}
```

Next is tricky but the same way as Church numeral’s Decrease2, which version with shifting the tuple.

## Index

The same as other list encodings:

```csharp
public static partial class _ListNodeExtensions
{
    // Index = start => index => index(Next)(start)
    public static _ListNode<T> Index<T>
        (this _ListNode<T> start, _Numeral index) => index.Numeral<_ListNode<T>>()(Next)(start);
}
```

## Unit tests

```csharp
[TestClass()]
public class _ListNodeTests
{
    [TestMethod()]
    public void CreateValueNextTest()
    {
        _ListNode<int> node1 = _ListNodeExtensions.Create(1)(_ListNodeExtensions.GetNull<int>());
        _ListNode<int> node2 = _ListNodeExtensions.Create(2)(node1);
        _ListNode<int> node3 = _ListNodeExtensions.Create(3)(node2);
        Assert.AreEqual(1, node1.Value());
        Assert.AreEqual(_ListNodeExtensions.GetNull<int>(), node1.Next());
        Assert.AreEqual(2, node2.Value());
        Assert.AreEqual(node1.Value(), node2.Next().Value());
        Assert.AreEqual(3, node3.Value());
        Assert.AreEqual(node2.Value(), node3.Next().Value());
        Assert.IsTrue(_ListNodeExtensions.GetNull<object>().Next().IsNull()._Unchurch());
    }

    [TestMethod()]
    public void NullIsNullTest()
    {
        _ListNode<int> node = _ListNodeExtensions.Create(1)(_ListNodeExtensions.GetNull<int>());
        Assert.IsTrue(_ListNodeExtensions.GetNull<object>().IsNull()._Unchurch());
        Assert.IsFalse(node.IsNull()._Unchurch());
    }

    [TestMethod()]
    public void IndexTest()
    {
        _ListNode<int> node1 = _ListNodeExtensions.Create(1)(_ListNodeExtensions.GetNull<int>());
        _ListNode<int> node2 = _ListNodeExtensions.Create(2)(node1);
        _ListNode<int> node3 = _ListNodeExtensions.Create(3)(node2);
        Assert.AreEqual(node3.Value(), node3.Index(0U._Church()).Value());
        Assert.AreEqual(node2.Value(), node3.Index(1U._Church()).Value());
        Assert.AreEqual(node1.Value(), node3.Index(2U._Church()).Value());
        Assert.IsTrue(node3.Index(3U._Church()).IsNull()._Unchurch());
        Assert.IsTrue(node3.Index(4U._Church()).IsNull()._Unchurch());
        Assert.IsTrue(node3.Index(5U._Church()).IsNull()._Unchurch());
    }
}
```