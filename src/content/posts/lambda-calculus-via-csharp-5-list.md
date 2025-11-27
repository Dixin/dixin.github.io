---
title: "Lambda Calculus via C# (5) List"
published: 2024-11-13
description: "In lambda calculus and Church encoding, there are various ways to represent a list with anonymous functions."
image: ""
tags: [".NET", "C#", "Church Encoding", "Church Lists", "Functional Programming", "Lambda Calculus", "LINQ via C#"]
category: ".NET"
draft: false
lang: ""
---

## \[[FP & LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

In lambda calculus and Church encoding, there are various ways to represent a list with anonymous functions.

## Tuple as list node

With Church pair, it is easy to model Church list as a linked list, where each list node is a a Church pair (2-tuple) of current node’s value and the next node, So that

```csharp
CreateListNode := CreateTuple = λv.λn.λf.f v n
ListNode := Tuple = λf.f v n
```

Here variable v is the value of the current node, so it is the first item of the tuple; And variable n is the next node of the current node, so it is the second item of the tuple:

```csharp
Value := Item1 = λl.l (λv.λn.v)
Next := Item2 = λl.l (λv.λn.n)
```

Here variable l is the list node. The C# implementation is similar to tuple and signed numeral, except ListNode<T> function type now has 1 type parameter, which is the type of its value:

```csharp
// ListNode<T> is the alias of Tuple<T, ListNode<T>>.
public delegate dynamic ListNode<out T>(Boolean f);

public static partial class ChurchList<T>
{
    // Create = value => next => (value, next)
    public static readonly Func<T, Func<ListNode<T>, ListNode<T>>>
        Create = value => next => new ListNode<T>(ChurchTuple<T, ListNode<T>>.Create(value)(next));

    // Value = node => node.Item1()
    public static readonly Func<ListNode<T>, T> 
        Value = node => new Tuple<T, ListNode<T>>(node).Item1();

    // Next = node => node.Item2()
    public static readonly Func<ListNode<T>, ListNode<T>> 
        Next = node => new Tuple<T, ListNode<T>>(node).Item2();
}
```

Usually, when a list ends, its last node’s next node is flagged as a special null node. Here in lambda calculus, since a node is an anonymous function, the null node is also an anonymous function:

```csharp
Null := λf.λx.x
```

And IsNull predicate returns a Church Boolean to indicate whether a list node is null:

```csharp
IsNull := λl.l (λv.λn.λx.False) True
```

When IsNull is applied with a null node:

```csharp
IsNull Null
≡ (λl.l (λv.λn.λx.False) True) (λf.λx.x)
≡ (λf.λx.x) (λv.λn.λx.False) True
≡ (λx.x) True
≡ True
```

And when IsNull is applied with a non-null node:

```csharp
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

```csharp
using static ChurchBoolean;

public static partial class ChurchList<T>
{
    // Null = False;
    public static readonly ListNode<T>
        Null = new ListNode<T>(False);

    // IsNull = node => node(value => next => _ => False)(True)
    public static readonly Func<ListNode<T>, Boolean> 
        IsNull = node => node(value => next => new Func<Boolean, Boolean>(_ => False))(True);
}
```

And the indexer for list can be easily defined with as a function accepts a start node and a Church numeral i as the specified index. To return the node at the specified index, just call Next function for i times from the start node:

```csharp
ListNodeAt := λl.λi.i Next l
```

C#:

```csharp
public static readonly Func<ListNode<T>, Func<Numeral, ListNode<T>>>
    ListNodeAt = start => index => index(node => Next(node))(start);
```

The following are the extension methods wrapping the list operators:

```csharp
public static class ListNodeExtensions
{
    public static T Value<T>(this ListNode<T> node) => ChurchList<T>.Value(node);

    public static ListNode<T> Next<T>(this ListNode<T> node) => ChurchList<T>.Next(node);

    public static Boolean IsNull<T>(this ListNode<T> node) => ChurchList<T>.IsNull(node);

    public static ListNode<T> ListNodeAt<T>(this ListNode<T> start, Numeral index) => ChurchList<T>.ListNodeAt(start)(index);
}
```

And the following code demonstrates how the list works:

```csharp
[TestClass]
public class ChurchListTests
{
    [TestMethod]
    public void CreateValueNextTest()
    {
        ListNode<int> node1 = ChurchList<int>.Create(1)(ChurchList<int>.Null);
        ListNode<int> node2 = ChurchList<int>.Create(2)(node1);
        ListNode<int> node3 = ChurchList<int>.Create(3)(node2);
        Assert.AreEqual(1, node1.Value());
        Assert.AreEqual(ChurchList<int>.Null, node1.Next());
        Assert.AreEqual(2, node2.Value());
        Assert.AreEqual(node1, node2.Next());
        Assert.AreEqual(3, node3.Value());
        Assert.AreEqual(node2, node3.Next());
        Assert.AreEqual(node2.Value(), node3.Next().Value());
        Assert.AreEqual(node1.Value(), node3.Next().Next().Value());
        Assert.AreEqual(ChurchList<int>.Null, node3.Next().Next().Next());
        try
        {
            ChurchList<object>.Null.Next();
            Assert.Fail();
        }
        catch (InvalidCastException exception)
        {
            exception.WriteLine();
        }
    }

    [TestMethod]
    public void IsNullTest()
    {
        ListNode<int> node1 = ChurchList<int>.Create(1)(ChurchList<int>.Null);
        ListNode<int> node2 = ChurchList<int>.Create(2)(node1);
        ListNode<int> node3 = ChurchList<int>.Create(3)(node2);
        Assert.IsTrue(ChurchList<object>.Null.IsNull().Unchurch());
        Assert.IsFalse(node1.IsNull().Unchurch());
        Assert.IsFalse(node2.IsNull().Unchurch());
        Assert.IsFalse(node3.IsNull().Unchurch());
        Assert.IsTrue(node1.Next().IsNull().Unchurch());
        Assert.IsFalse(node2.Next().IsNull().Unchurch());
        Assert.IsFalse(node3.Next().IsNull().Unchurch());
    }

    [TestMethod]
    public void IndexTest()
    {
        ListNode<int> node1 = ChurchList<int>.Create(1)(ChurchList<int>.Null);
        ListNode<int> node2 = ChurchList<int>.Create(2)(node1);
        ListNode<int> node3 = ChurchList<int>.Create(3)(node2);
        Assert.AreEqual(node3, node3.NodeAt(0U.Church()));
        Assert.AreEqual(node2, node3.NodeAt(1U.Church()));
        Assert.AreEqual(node1, node3.NodeAt(2U.Church()));
        Assert.IsTrue(node3.NodeAt(3U.Church()).IsNull().Unchurch());
        try
        {
            node3.NodeAt(4U.Church());
            Assert.Fail();
        }
        catch (InvalidCastException exception)
        {
            exception.WriteLine();
        }
    }
}
```

## Aggregate function as list node

Remember the LINQ Aggregate query method accepting a seed and a accumulator function:

```csharp
TAccumulate Aggregate<TSource, TAccumulate>(this IEnumerable<TSource> source, TAccumulate seed, Func<TAccumulate, TSource, TAccumulate> func);
```

Assume seed is x, and accumulator function is f:

-   When source is empty, the aggregation result is x
-   When source is { 0 }, the aggregation result is f(x, 0)
-   When source is { 1, 0 }, the aggregation result is f(f(x, 1), 0)
-   When source is { 2, 1, 0 }, the aggregation result is f(f(f(x, 2), 1), 0)

Church list can also be encoded with a similar Aggregate function with seed and accumulator function:

```csharp
dynamic AggregateListNode<T>(dynamic x, Func<dynamic, T, dynamic> f);
```

Its type parameter T is the type of node value. And since the seed can be anything, just leave it as dynamic as usual. So the list node is of above aggregate function type (dynamic, (dynamic , T) -> dynamic) -> dynamic. After currying the aggregate function and the accumulator function, it becomes dynamic -> (dynamic –> T -> dynamic) -> dynamic. So this is the function type of list node, and an alias can be defined as:

```csharp
// Curried from: (dynamic, dynamic -> T -> dynamic) -> dynamic.
// AggregateListNode is the alias of: dynamic -> (dynamic -> T -> dynamic) -> dynamic.
public delegate Func<Func<dynamic, Func<T, dynamic>>, dynamic> AggregateListNode<out T>(dynamic x);
```

And this is the creation and definition of list node:

```csharp
CreateListNode := λv.λn.λx.λf.f (n x f) v
ListNode := λx.λf.f (n x f) v
```

In C#:

```csharp
public static partial class ChurchAggregateList<T>
{
    public static readonly Func<T, Func<AggregateListNode<T>, AggregateListNode<T>>>
        Create = value => next => x => f => f(next(x)(f))(value);
}
```

Similarly, here variable v is the value of current node, variable n is the next node of the current node. And variable x is the seed for aggregation, variable f is the accumulator function. The list is still modeled as a linked list, so Null is also needed to represent the end of list:

```csharp
Null := λx.λf.x
```

Null is defined to call f for 0 times. For example, to create a linked list { 2, 1, 0 }, first create the last list node, with value 2 and Null as its next node:

```csharp
CreateListNode 0 Null
≡ (λv.λn.λx.λf.f (n x f) v) 0 (λx.λf.x)
≡ (λn.λx.λf.f (n x f) 0) (λx.λf.x)
≡ λx.λf.f ((λx.λf.x) x f) 0
≡ λx.λf.f x 0
```

Then the previous node can be created with value 1 and the above node:

```csharp
CreateListNode 1 (CreateListNode 0 Null)
≡ CreateListNode 1 (λx.λf.f x 0)
≡ (λv.λn.λx.λf.f (n x f) v) 1 (λx.λf.f x 0)
≡ (λn.λx.λf.f (n x f) 1) (λx.λf.f x 0)
≡ λx.λf.f ((λx.λf.f x 0) x f) 1
≡ λx.λf.f (f x 0) 1
```

And the first node has value 0:

```csharp
CreateListNode 2 (CreateListNode 1 (CreateListNode 0 Null))
≡ CreateListNode 2 (λx.λf.f (f x 0) 1)
≡ (λv.λn.λx.λf.f (n x f) v) 2 (λx.λf.f (f x 0) 1)
≡ (λn.λx.λf.f (n x f) 2) (λx.λf.f (f x 0) 1)
≡ λx.λf.f (λx.λf.f (f x 0) 1) x f) 2
≡ λx.λf.f (f (f x 0) 1) 2
```

So the list nodes are represented in the same pattern as LINQ aggregation.

The IsNull predicate can be defined as following:

```csharp
IsNull := λl.l True (λx.λv.False)
```

The variable l is the list node, which is an aggregate function, and is applied with seed True and accumulate function λv.λx.False. When IsNull is applied with a null node, the accumulate function is not applied, and seed True is directly returned:

```csharp
IsNull Null
≡ (λl.l True (λx.λv.False)) (λx.λf.x)
≡ (λx.λf.x) True (λx.λv.False)
≡ (λf.True) (λx.λv.False)
≡ True
```

And when IsNull is applied with a non null node, the accumulator function is applied and constantly returns False, so IsNull returns False:

```csharp
IsNull (CreateListNode 2 Null)
≡ IsNull (λx.λf.f x 2)
≡ (λl.l True (λx.λv.False)) (λx.λf.f x 2)
≡ (λx.λf.f x 2) True (λx.λv.False)
≡ (λf.f True 2) (λx.λv.False)
≡ (λx.λv.False) True 2
≡ False
```

In C#:

```csharp
using static ChurchBoolean;

public static partial class ChurchAggregateList<T>
{
    public static readonly AggregateListNode<T>
        Null = x => f => x;

    public static readonly Func<AggregateListNode<T>, Boolean>
        IsNull = node => node(True)(x => value => False);
}
```

The following function returns the value from the specified node:

```csharp
Value := λl.l Id (λx.λv.v)
```

When Value is applied with a node, which has value v and next node n:

```csharp
Value (CreateListNode v n)
≡ Value (λx.λf.f (n x f) v)
≡ (λl.l Id (λx.λv.v)) (λx.λf.f (n x f) v)
≡ (λx.λf.f (n x f) v) Id (λx.λv.v)
≡ (λf.f (n Id f) v) (λx.λv.v)
≡ (λx.λv.v) (n Id f) v
≡ (λv.v) v
≡ v
```

In C#:

```csharp
// Value = node => node(Id)(x => value => value)
public static readonly Func<AggregateListNode<T>, T>
    Value = node => node(Functions<T>.Id)(x => value => value);
```

It is not very intuitive to get a node’s next node:

```csharp
Next := λl.λx.λf.l (λf.x) (λx.λv.λg.g (x f) v) (λx.λv.v)
```

In C#:

```csharp
// Next = node => x => f => node(_ => x)(accumulate => value => (g => g(accumulate(f))(value)))(accumulate => value => accumulate);
public static readonly Func<AggregateListNode<T>, AggregateListNode<T>>
    Next = node => x => f => node(new Func<Func<dynamic, Func<T, dynamic>>, dynamic>(_ => x))(accumulate => value => new Func<Func<dynamic, Func<T, dynamic>>, dynamic>(g => g(accumulate(f))(value)))(new Func<dynamic, Func<T, dynamic>>(accumulate => value => accumulate));
```

The above definition is similar to the the pattern of initial version Subtract function for Church numeral. So it can be defined by shifting tuple too. Again, list node with value v and next node n is a aggregate function, it can be applied with a tuple of Null nodes as seed, and a accumulator function to swap the tuple:

```csharp
(CreateListNode v n) (Null, Null) (λt.λv.Shift (CreateListNode v) t)
≡ (λx.λf.f (n x f) v) (Null, Null) (λt.λv.Shift (CreateListNode v) t)
≡ (λf.f (n (Null, Null) f) v) (λt.λv.Shift (CreateListNode v) t)
≡ (λt.λv.Shift (CreateListNode v) t) (n (Null, Null) (λt.λv.Shift (CreateListNode v)) t) v
≡ (λv.Shift (CreateListNode v) (n (Null, Null) (λt.λv.Shift (CreateListNode v)) t)) v
≡ Shift (CreateListNode v) (n (Null, Null) (λt.λv.Shift (CreateListNode v)) t)
```

Take list { n, n – 1, …, 2, 1, 0 } as example, assume its nodes are ListNoden, ListNoden - 1, …, ListNode2, ListNode1, ListNode0:

-   the last node is: CreateListNode 0 Null
-   the second last node is: CreateListNode 1 (CreateListNode 0 Null)
-   the third last node is: CreateListNode 2 (CreateListNode 1 (CreateListNode 0 Null))
-   …

Now apply these nodes with above tuple seed and tuple shifting accumulator function:

```csharp
ListNode0 (Null, Null) (λt.λv.Shift (CreateListNode v) t)
≡ (CreateListNode 0 Null) (Null, Null) (λt.λv.Shift (CreateListNode v) t)
≡ Shift (CreateListNode 0) (Null (Null, Null) (λt.λv.Shift (CreateListNode v)) t)
≡ Shift (CreateListNode 0) ((λx.λf.λx) (Null, Null) (λt.λv.Shift (CreateListNode v)) t)
≡ Shift (CreateListNode 0) (Null, Null)
≡ (Null, CreateListNode 0 Null)
≡ (Null, ListNode0)

  ListNode1 (Null, Null) (λt.λv.Shift (CreateListNode v) t)
≡ (CreateListNode 1 (CreateListNode 0 Null)) (Null, Null) (λt.λv.Shift (CreateListNode v) t)
≡ Shift (CreateListNode 1) ((CreateListNode 0 Null) (Null, Null) (λt.λv.Shift (CreateListNode v)) t)
≡ Shift (CreateListNode 1) (Null, Create ListNode 0 Null)
≡ (CreateListNode 0 Null, (CreateListNode 1 (CreateListNode 0 Null))
≡ (ListNode0, ListNode1)

  ListNode2 (Null, Null) (λt.λv.Shift (CreateListNode v) t)
≡ (CreateListNode 2 (CreateListNode 1 (CreateListNode 0 Null))) (Null, Null) (λt.λv.Shift (CreateListNode v) t)
≡ Shift (CreateListNode 2) ((CreateListNode 1 (CreateListNode 0 Null)) (Null, Null) (λt.λv.Shift (CreateListNode v)) t)
≡ Shift (CreateListNode 2) (CreateListNode 0 Null, (CreateListNode 1 (CreateListNode 0 Null))
≡ ((CreateListNode 1 (CreateListNode 0 Null), CreateListNode 2 (CreateListNode 1 (CreateListNode 0 Null)))
≡ (ListNode1, ListNode2)

...

  ListNoden (Null, Null) (λt.λv.Shift (CreateListNode v) t)
≡ (ListNoden - 1, ListNoden)
```

Generally, there is:

```csharp
(CreateListNode v n) (Null, Null) (λt.λv.Shift (CreateListNode v) t)
≡ (n, Create v n)
```

So Next can be defined as:

```csharp
Next := λl.Item2 (l (CreateTuple Null Null) (λt.λv.Shift (CreateListNode v) t))
```

In C#:

```csharp
// Next = node => node((Null, Null))(tuple => value => tuple.Shift(ChurchTuple.Create(value))).Item1()
public static readonly Func<AggregateListNode<T>, AggregateListNode<T>>
    Next = node =>
        ((Tuple<AggregateListNode<T>, AggregateListNode<T>>)node
            (ChurchTuple<AggregateListNode<T>, AggregateListNode<T>>.Create(Null)(Null))
            (tuple => value => ((Tuple<AggregateListNode<T>, AggregateListNode<T>>)tuple).Shift(Create(value))))
        .Item1();
```

The indexer can be defined the same as above:

```csharp
ListNodeAt := λl.λi.i Next l
```

In C#;

```csharp
public static readonly Func<AggregateListNode<T>, Func<Numeral, AggregateListNode<T>>>
    ListNodeAt = start => index => index(node => Next(node))(start);
```

The following are the extension methods wrapping the list operators:

```csharp
public static class AggregateListNodeExtensions
{
    public static Boolean IsNull<T>(this AggregateListNode<T> node) => ChurchAggregateList<T>.IsNull(node);

    public static T Value<T>(this AggregateListNode<T> node) => ChurchAggregateList<T>.Value(node);

    public static AggregateListNode<T> Next<T>(this AggregateListNode<T> node) => 
        ChurchAggregateList<T>.Next(node);

    public static AggregateListNode<T> ListNodeAt<T>(this AggregateListNode<T> start, Numeral index) => 
        ChurchAggregateList<T>.ListNodeAt(start)(index);
}
```

And the following code demonstrate how the list works:

```csharp
[TestClass]
public class ChurchAggregateListTests
{
    [TestMethod]
    public void CreateValueNextTest()
    {
        AggregateListNode<int> node1 = ChurchAggregateList<int>.Create(1)(ChurchAggregateList<int>.Null);
        AggregateListNode<int> node2 = ChurchAggregateList<int>.Create(2)(node1);
        AggregateListNode<int> node3 = ChurchAggregateList<int>.Create(3)(node2);
        Assert.AreEqual(1, node1.Value());
        Assert.IsTrue(node1.Next().IsNull().Unchurch());
        Assert.AreEqual(2, node2.Value());
        Assert.AreEqual(node1.Value(), node2.Next().Value());
        Assert.AreEqual(3, node3.Value());
        Assert.AreEqual(node2.Value(), node3.Next().Value());
        Assert.AreEqual(node1.Value(), node3.Next().Next().Value());
        Assert.IsTrue(node3.Next().Next().Next().IsNull().Unchurch());
    }

    [TestMethod]
    public void IsNullTest()
    {
        AggregateListNode<int> node1 = ChurchAggregateList<int>.Create(1)(ChurchAggregateList<int>.Null);
        AggregateListNode<int> node2 = ChurchAggregateList<int>.Create(2)(node1);
        AggregateListNode<int> node3 = ChurchAggregateList<int>.Create(3)(node2);
        Assert.IsTrue(ChurchAggregateList<int>.Null.IsNull().Unchurch());
        Assert.IsFalse(node1.IsNull().Unchurch());
        Assert.IsFalse(node2.IsNull().Unchurch());
        Assert.IsFalse(node3.IsNull().Unchurch());
        Assert.IsTrue(node1.Next().IsNull().Unchurch());
        Assert.IsFalse(node2.Next().IsNull().Unchurch());
        Assert.IsFalse(node3.Next().IsNull().Unchurch());
    }

    [TestMethod]
    public void IndexTest()
    {
        AggregateListNode<int> node1 = ChurchAggregateList<int>.Create(1)(ChurchAggregateList<int>.Null);
        AggregateListNode<int> node2 = ChurchAggregateList<int>.Create(2)(node1);
        AggregateListNode<int> node3 = ChurchAggregateList<int>.Create(3)(node2);
        Assert.AreEqual(node3.Value(), node3.NodeAt(0U.Church()).Value());
        Assert.AreEqual(node2.Value(), node3.NodeAt(1U.Church()).Value());
        Assert.AreEqual(node1.Value(), node3.NodeAt(2U.Church()).Value());
        Assert.IsTrue(node3.NodeAt(3U.Church()).IsNull().Unchurch());
    }
}
```

## Model everything

Once again, in lambda calculus the only primitive is anonymous function. So far many data types and operations are modeled by anonymous functions, including Boolean, unsigned and signed numeral, tuple, list, logic, arithmetic (except division, which will be implemented later), predicate, etc. With these facilities, many other data types and operations can be modeled too. For example:

-   [Floating point number](https://en.wikipedia.org/wiki/Floating_point) can be represented in the form of significand \* baseexponent. In [IEEE 754 (aka IEC 60559)](https://en.wikipedia.org/wiki/IEEE_floating_point), floating point numbers are [represented](https://www.h-schmidt.net/FloatConverter/IEEE754.html) as binary format (sign) significand \* 2exponent ([System.Single and System.Double](http://www.ecma-international.org/publications/standards/Ecma-335.htm) in .NET), and decimal format (sign) significand \* 10exponent (System.Decimal). So either representation can be modeled with a 3-tuple of (Boolean, unsigned numeral, signed numeral).
-   Character (System.Char in .NET) can be represented by unsigned numeral.
-   String (System.String in .NET) can be modeled by a list of characters.
-   Tuple and list can represent other data structures, like tree, stack, queue, etc.
-   …

And eventually everything can be modeled with anonymous function represented by lambda expression. Actually, lambda calculus is a classic example of [Turing completeness](https://en.wikipedia.org/wiki/Turing_completeness). Lambda calculus is introduced by Alonzo Church before [Turing machine](https://en.wikipedia.org/wiki/Turing_machine) was introduced by Alan Turing, and they are equivalent. Lambda calculus, as a universal model of computation, is the rationale and foundations of functional programming. Functional languages (or the functional subset of languages) can be viewed as lambda calculus with more specific syntax, and the execution of functional program can be viewed as reduction of lambda calculus expression.