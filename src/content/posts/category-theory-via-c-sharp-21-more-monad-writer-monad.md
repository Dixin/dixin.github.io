---
title: "Category Theory via C# (21) More Monad: Writer< , > Monad"
published: 2018-12-22
description: "Unlike the Reader< , > monad, the Writer< , > monad output contents with a sequence of functions:"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-8-more-linq-to-monads](/posts/category-theory-via-csharp-8-more-linq-to-monads "https://weblogs.asp.net/dixin/category-theory-via-csharp-8-more-linq-to-monads")**

## Writer< , > monad

Unlike the Reader< , > monad, the Writer< , > monad output contents with a sequence of functions:

```csharp
public class Writer<T, TContent>
{
    private readonly Lazy<Tuple<T, TContent>> lazy;

    public Writer(Func<Tuple<T, TContent>> factory, IMonoid<TContent> monoid)
    {
        this.lazy = new Lazy<Tuple<T, TContent>>(factory);
        this.Monoid = monoid;
    }

    public T Value
    {
        [Pure]get { return this.lazy.Value.Item1; }
    }
public TContent Content
    {
        [Pure]get { return this.lazy.Value.Item2; }
    }

    public IMonoid<TContent> Monoid {[Pure] get; }
}
```

A Writer< , > is more complex than Reader< , >. It is a pair of value and output content, plus a monoid. A monoid is needed because its Binary operator is used to combine multiple output contents into one.

This is the SelectMany:

```csharp
[Pure]
public static partial class WriterExtensions
{
    // Required by LINQ.
    public static Writer<TResult, TContent> SelectMany<TSource, TContent, TSelector, TResult>
        (this Writer<TSource, TContent> source,
         Func<TSource, Writer<TSelector, TContent>> selector,
         Func<TSource, TSelector, TResult> resultSelector) => 
            new Writer<TResult, TContent>(() =>
                {
                    Writer<TSelector, TContent> selectorResult = selector(source.Value);
                    return Tuple.Create(
                        resultSelector(source.Value, selectorResult.Value),
                        source.Monoid.Binary(source.Content, selectorResult.Content));
                }, source.Monoid);

    // Not required, just for convenience.
    public static Writer<TResult, TContent> SelectMany<TSource, TContent, TResult>
        (this Writer<TSource, TContent> source,
            Func<TSource, Writer<TResult, TContent>> selector) => source.SelectMany(selector, Functions.False);
}
```

so that

```csharp
// [Pure]
public static partial class WriterExtensions
{
    // μ: Writer<Writer<T, TContent>> => Writer<T, TContent>
    public static Writer<TResult, TContent> Flatten<TResult, TContent>
        (Writer<Writer<TResult, TContent>, TContent> source) => source.SelectMany(Functions.Id);

    // η: T -> Writer<T, TContent>
    public static Writer<T, TContent> Writer<T, TContent>
        (this T value, TContent content, IMonoid<TContent> monoid) => 
            new Writer<T, TContent>(() => Tuple.Create(value, content), monoid);

    // φ: Lazy<Writer<T1, TContent>, Writer<T2, TContent>> => Writer<Lazy<T1, T2>, TContent>
    public static Writer<Lazy<T1, T2>, TContent> Binary<T1, T2, TContent>
        (this Lazy<Writer<T1, TContent>, Writer<T2, TContent>> binaryFunctor) => 
            binaryFunctor.Value1.SelectMany(
                value1 => binaryFunctor.Value2,
                (value1, value2) => new Lazy<T1, T2>(value1, value2));

    // ι: TUnit -> Writer<TUnit, TContent>
    public static Writer<Unit, TContent> Unit<TContent>
        (Unit unit, TContent content, IMonoid<TContent> monoid) => unit.Writer(content, monoid);

    // Select: (TSource -> TResult) -> (Writer<TSource, TContent> -> Writer<TResult, TContent>)
    public static Writer<TResult, TContent> Select<TSource, TResult, TContent>
        (this Writer<TSource, TContent> source, Func<TSource, TResult> selector) => 
            source.SelectMany(value => selector(value).Writer(source.Content, source.Monoid));
}
```

A typical usage is to output string logs when applying a sequence of functions:

```csharp
// [Pure]
public static partial class WriterExtensions
{
    public static Writer<TSource, IEnumerable<string>> WithLog<TSource>(this TSource value, string log) =>
        value.Writer(
            $"{DateTime.Now.ToString("o", CultureInfo.InvariantCulture)} - {log}".Enumerable(),
            Enumerable.Empty<string>().Monoid((a, b) => a.Concat(b)));
}
```

Take previous IEnumerable stack as example:

```csharp
public static void Stack()
{
    IEnumerable<int> stack = Enumerable.Empty<int>();
    Writer<IEnumerable<int>, IEnumerable<string>> writer =
        from lazy1 in stack.Push(1).WithLog("Push 1 to stack.")
        from lazy2 in lazy1.Value2.Push(2).WithLog("Push 2 to stack.")
        from lazy3 in lazy2.Value2.Pop().WithLog("Pop 2 from stack.")
        from stack1 in Enumerable.Range(0, 3).WithLog("Reset stack to 0, 1, 2.")
        from lazy4 in stack1.Push(4).WithLog("Push 4 to stack.")
        from lazy5 in lazy4.Value2.Pop().WithLog("Pop 4 from stack.")
        from stack2 in lazy5.Value2.WithLog("Get current stack.")
        select stack2;

    IEnumerable<int> resultStack = writer.Value;
    IEnumerable<string> logs = writer.Content;
    logs.ForEach(log => Trace.WriteLine(log));
}
```

The logs will be like:

> 2015-05-25T10:18:50.1769264-07:00 - Push 1 to stack. 2015-05-25T10:18:50.1769264-07:00 - Push 2 to stack. 2015-05-25T10:18:50.2082128-07:00 - Pop 2 from stack. 2015-05-25T10:18:50.2082128-07:00 - Reset stack to 0, 1, 2. 2015-05-25T10:18:50.2082128-07:00 - Push 4 to stack. 2015-05-25T10:18:50.2082128-07:00 - Pop 4 from stack. 2015-05-25T10:18:50.2082128-07:00 - Get current stack.

## Monad laws, and unit tests

```csharp
public partial class MonadTests
{
    [TestMethod()]
    public void WriterTest()
    {
        bool isExecuted1 = false;
        Func<int> f1 = () => 1;
        Func<int, Func<int, Func<string, int>>> f2 = x => y => z =>
            { isExecuted1 = true; return x + y + z.Length; };
        Writer<int, IEnumerable<string>> query = from x in f1().WithLog("a")
                                                    from y in 2.WithLog("b")
                                                    from z in "xyz".WithLog("c")
                                                    select f2(x)(y)(z);
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.AreEqual(1 + 2 + "xyz".Length, query.Value); // Execution.
        string[] logs = query.Content.ToArray();
        Assert.IsTrue(logs.Length==3);
        Assert.IsTrue(logs[0].EndsWith(" - a"));
        Assert.IsTrue(logs[1].EndsWith(" - b"));
        Assert.IsTrue(logs[2].EndsWith(" - c"));
        Assert.IsTrue(isExecuted1);

        IMonoid<string> monoid = string.Empty.Monoid((a, b) => string.Concat(a, b));
        // Monad law 1: m.Monad().SelectMany(f) == f(m)
        Func<int, Writer<int, string>> addOne = x => (x + 1).Writer("a", monoid);
        Writer<int, string> left = 1.Writer("b", monoid).SelectMany(addOne);
        Writer<int, string> right = addOne(1);
        Assert.AreEqual(left.Value, right.Value);
        Assert.AreEqual("ba", left.Content);
        Assert.AreEqual("a", right.Content);
        // Monad law 2: M.SelectMany(Monad) == M
        Func<int, Writer<int, string>> Resturn = x => x.Writer("abc", monoid);
        Writer<int, string> M = Resturn(1);
        left = M.SelectMany(Resturn);
        right = M;
        Assert.AreEqual(left.Value, right.Value);
        Assert.AreEqual("abcabc", left.Content);
        Assert.AreEqual("abc", right.Content);
        // Monad law 3: M.SelectMany(f1).SelectMany(f2) == M.SelectMany(x => f1(x).SelectMany(f2))
        Func<int, Writer<int, string>> addTwo = x => (x + 2).Writer("b", monoid);
        left = M.SelectMany(addOne).SelectMany(addTwo);
        right = M.SelectMany(x => addOne(x).SelectMany(addTwo));
        Assert.AreEqual(left.Value, right.Value);
        Assert.AreEqual("abcab", left.Content);
        Assert.AreEqual("abcab", right.Content);
    }
}
```