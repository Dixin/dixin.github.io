---
title: "Category Theory via C# (18) More Monad: IO<> Monad"
published: 2018-12-19
description: "As mentioned in a previous part, in purely functional programming, functions cannot have side effects. For example, when defining LINQ queries, laziness and purity are expected. So, how should the imp"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-8-more-linq-to-monads](/posts/category-theory-via-csharp-8-more-linq-to-monads "https://weblogs.asp.net/dixin/category-theory-via-csharp-8-more-linq-to-monads")**

As mentioned in a previous part, in purely functional programming, functions cannot have side effects. For example, when defining LINQ queries, laziness and purity are expected. So, how should the impure actions be managed in purely functional programming or LINQ? For example:

-   Read from/write to console
-   Read from/write to file system
-   Download from/upload to Internet

etc. The [IO<> monad](http://en.wikipedia.org/wiki/Monad_\(functional_programming\)#The_I.2FO_monad) is an approach.

## IO<T> and impurity

The definition of IO<> is simple:
```
public delegate T IO<out T>();
```

Syntactically it is just Func<T>. However, it is used to represent a different semantic:

-   Here in category theory and functional programming, Func<T> is used to represent a pure function. When a Func<T> value is executed, it returns a T value without side effects
-   IO<T> is used to represent a impure function. When a IO<T> function is applied, it returns a T value, with side effects.

So above examples can be represented with IO<T>

-   Read a line from console: Console.ReadLine: () → string
    -   Syntactically it is a Func<string>.
    -   Now with IO<T>, semantically it can be represented as IO<string>, meaning when applied it returns a string value with side effect
-   Write a line to console: Console.WriteLIne: string → Void
    -   Syntactically it is an Action<string> or Func<string, Void>, since it takes a string parameter and returns nothing (Void)
    -   Now semantically it can be a Func<string, IO<Void>>, meaning it is will eventually return nothing (a Void value) with side effect
        -   Because C# does not allow using Void in that way, Console.WriteLIne will be represented by Func<string, IO<Unit>>, by borrowing [Unit from F#](https://msdn.microsoft.com/en-us/library/ee370443.aspx).
        -   Actually, in F# Console.WriteLine is of type string -> Unit
-   Read text from a file: File.ReadAllText: string → string
    -   Syntactically it is a Func<string, string>, since it takes a file path parameter and returns the text in that file
    -   Now semantically it should be a Func<string, IO<string>>
-   Write text to a file: File.WriteAllText: (string, string) → Void
    -   Syntactically it is an Action<string, string> or Func<string, string, Void>, since it takes a file path parameter and a text parameter, and returns nothing (Void)
    -   Now semantically it should be a Func<string, string, IO<Unit>>

etc. The following extension methods convert Func<T> to IO<T>, etc.:
```
[Pure]
public static partial class IOExtensions
{
    public static IO<Unit> AsIO
        (this Action action) => 
            () =>
                {
                    action();
                    return null;
                };

    public static Func<T, IO<Unit>> AsIO<T>
        (this Action<T> action) => arg => 
            () =>
                {
                    action(arg);
                    return null;
                };

    public static Func<T1, T2, IO<Unit>> AsIO<T1, T2>
        (this Action<T1, T2> action) => (arg1, arg2) => 
            () =>
                {
                    action(arg1, arg2);
                    return null;
                };

    public static Func<T1, T2, T3, IO<Unit>> AsIO<T1, T2, T3>
        (this Action<T1, T2, T3> action) => (arg1, arg2, arg3) => 
            () =>
                {
                    action(arg1, arg2, arg3);
                    return null;
                };

    public static Func<T1, T2, T3, T4, IO<Unit>> AsIO<T1, T2, T3, T4>
        (this Action<T1, T2, T3, T4> action) => (arg1, arg2, arg3, arg4) => 
            () =>
                {
                    action(arg1, arg2, arg3, arg4);
                    return null;
                };

    // ...

    public static IO<TResult> AsIO<TResult>
        (this Func<TResult> function) => 
            () => function();

    public static Func<T, IO<TResult>> AsIO<T, TResult>
        (this Func<T, TResult> function) => arg => 
            () => function(arg);

    public static Func<T1, T2, IO<TResult>> AsIO<T1, T2, TResult>
        (this Func<T1, T2, TResult> function) => (arg1, arg2) => 
            () => function(arg1, arg2);

    public static Func<T1, T2, T3, IO<TResult>> AsIO<T1, T2, T3, TResult>
        (this Func<T1, T2, T3, TResult> function) => (arg1, arg2, arg3) => 
            () => function(arg1, arg2, arg3);

    public static Func<T1, T2, T3, T4, IO<TResult>> AsIO<T1, T2, T3, T4, TResult>
        (this Func<T1, T2, T3, T4, TResult> function) => (arg1, arg2, arg3, arg4) => 
            () => function(arg1, arg2, arg3, arg4);

    // ...
}
```

so that:
```
IO<string> consoleReadLine = new Func<string>(Console.ReadLine).AsIO();
Func<string, IO<Unit>> consoleWriteLine = new Action<string>(Console.WriteLine).AsIO();

Func<string, IO<string>> fileReadAllText = new Func<string, string>(File.ReadAllText).AsIO();
Func<string, string, IO<Unit>> fileWriteAllText = new Action<string, string>(File.WriteAllText).AsIO();

Func<string, IO<bool>> fileExists = new Func<string, bool>(File.Exists).AsIO();
// ...
```

A lot of type information as usual. Some other functions can be created to make the code shorter:
```
[Pure]
public static partial class IO
{
    public static IO<Unit> Action
        (Action action) => action.AsIO();

    public static Func<T, IO<Unit>> Action<T>
        (this Action<T> action) => action.AsIO();

    public static Func<T1, T2, IO<Unit>> Action<T1, T2>
        (this Action<T1, T2> action) => action.AsIO();

    public static Func<T1, T2, T3, IO<Unit>> Action<T1, T2, T3>
        (this Action<T1, T2, T3> action) => action.AsIO();

    public static Func<T1, T2, T3, T4, IO<Unit>> Action<T1, T2, T3, T4>
        (this Action<T1, T2, T3, T4> action) => action.AsIO();

    // ...

    public static IO<T> Func<T>
        (this Func<T> function) => function.AsIO();

    public static Func<T, IO<TResult>> Func<T, TResult>
        (this Func<T, TResult> function) => function.AsIO();

    public static Func<T1, T2, IO<TResult>> Func<T1, T2, TResult>
        (this Func<T1, T2, TResult> function) => function.AsIO();

    public static Func<T1, T2, T3, IO<TResult>> Func<T1, T2, T3, TResult>
        (this Func<T1, T2, T3, TResult> function) => function.AsIO();

    public static Func<T1, T2, T3, T4, IO<TResult>> Func<T1, T2, T3, T4, TResult>
        (this Func<T1, T2, T3, T4, TResult> function) => function.AsIO();

    // ...
}
```

so that:
```
IO<string> consoleReadLine = IO.Func(Console.ReadLine);
Func<string, IO<Unit>> consoleWriteLine = IO.Action<string>(Console.WriteLine);

Func<string, IO<string>> fileReadAllText = IO.Func<string, string>(File.ReadAllText);
Func<string, string, IO<Unit>> fileWriteAllText = IO.Action<string, string>(File.WriteAllText);

Func<string, IO<bool>> fileExists = IO.Func<string, bool>(File.Exists);
// ...
```

Some type parameters are still needed for IO.Action/IO.Func to locate the specific overload.

## IO<> monad

Again, for C# compiler, IO<> is exactly the same as Func<>, so IO<> must be a monad. The following SelectMany is copied from previous part of Func<> monad:
```
// [Pure]
public static partial class IOExtensions
{
    // Required by LINQ.
    public static IO<TResult> SelectMany<TSource, TSelector, TResult>
        (this IO<TSource> source, 
         Func<TSource, IO<TSelector>> selector, 
         Func<TSource, TSelector, TResult> resultSelector) => 
            () =>
                {
                    TSource sourceItem = source();
                    return resultSelector(sourceItem, selector(sourceItem)());
                };

    // Not required, just for convenience.
    public static IO<TResult> SelectMany<TSource, TResult>
        (this IO<TSource> source, Func<TSource, IO<TResult>> selector) => 
            source.SelectMany(selector, Functions.False);
}
```

The implementation for μ, φ, and ι are skipped since they are all the same as Func<>. Here is only Select implementation:
```
// [Pure]
public static partial class IOExtensions
{
    // η: T -> IO<T>
    public static IO<T> IO<T>
        (this T value) => () => value;

    // Select: (TSource -> TResult) -> (IO<TSource> -> IO<TResult>)
    public static IO<TResult> Select<TSource, TResult>
        (this IO<TSource> source, Func<TSource, TResult> selector) => 
            source.SelectMany(item => selector(item).IO());
}
```

Select has to be implemented so that [let clause](https://msdn.microsoft.com/en-us/library/bb383976.aspx) can be used in LINQ query:

```typescript
// 1. Read file name from console.
IO<Tuple<bool, string>> query1 = from fileName in IO.Func(Console.ReadLine)
                                 // 2. Write confirmation message to console.
                                 let message = string.Format(
                                                 CultureInfo.InstalledUICulture, "{0}? y/n", fileName)
                                 from _ in IO.Action<string>(Console.WriteLine)(message)
                                 // 3. Read confirmation from console.
                                 from confirmation in IO.Func(Console.ReadLine)
                                 // 4. If confirmed, read the file.
                                 let isConfirmed = string.Equals(
                                                 confirmation, "y", StringComparison.OrdinalIgnoreCase)
                                 from text in isConfirmed
                                                 ? IO.Func<string, string>(File.ReadAllText)(fileName)
                                                 : string.Empty.IO()
                                 // 5. Write text to console.
                                 from __ in IO.Action<string>(Console.WriteLine)(text)
                                 // 6. Returns text as query result.
                                 select new Tuple<bool, string>(isConfirmed, text); // Laziness.
Tuple<bool, string> result = query1(); // Execution.
```

Another example:

```typescript
// 1. Read URL from console.
IO<Unit> query2 = from url in IO.Func(Console.ReadLine)
                  // 2. Download string from Internet.
                  from text in IO.Func(() => new WebClient().DownloadString(url))
                  // 3. Write string to console.
                  let length = 1000
                  let message = text.Length <= length 
                          ? text
                          : string.Format(CultureInfo.InstalledUICulture, "{0}...", text.Substring(0, length))
                  from unit in IO.Action<string>(Console.WriteLine)(message)
                  select (Unit)null; // Laziness.
query2(); // Execution...
```

Both examples demonstrated the purity and laziness of IO<> monad. When defining the LINQ query, those involved impure functions are not applied at all. They are applied only when the query is executed. Again, IO<> is exactly the same as Func<> at compile time and run time. It is just artificially assigned a different semantic from Func<>.

## Monad laws, and unit tests

The following unit test demonstrates how IO<> monad satisfies the monad laws:
```
public partial class MonadTests
{
    [TestMethod()]
    public void IOTest()
    {
        bool isExecuted1 = false;
        bool isExecuted2 = false;
        bool isExecuted3 = false;
        bool isExecuted4 = false;
        IO<int> one = () => { isExecuted1 = true; return 1; };
        IO<int> two = () => { isExecuted2 = true; return 2; };
        Func<int, IO<int>> addOne = x => { isExecuted3 = true; return (x + 1).IO(); };
        Func<int, Func<int, IO<int>>> add = x => y => { isExecuted4 = true; return (x + y).IO(); };
        IO<IO<int>> query1 = from x in one
                                from y in two
                                from z in addOne.Partial(y)()
                                from _ in "abc".IO()
                                let addOne2 = add(x)
                                select addOne2(z);
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.IsFalse(isExecuted2); // Laziness.
        Assert.IsFalse(isExecuted3); // Laziness.
        Assert.IsFalse(isExecuted4); // Laziness.
        Assert.AreEqual(1 + 2 + 1, query1()()); // Execution.
        Assert.IsTrue(isExecuted1);
        Assert.IsTrue(isExecuted2);
        Assert.IsTrue(isExecuted3);
        Assert.IsTrue(isExecuted4);

        // Monad law 1: m.Monad().SelectMany(f) == f(m)
        Func<int, IO<int>> addOne3 = x => (x + 1).IO();
        IO<int> left = 1.IO().SelectMany(addOne3);
        IO<int> right = addOne3(1);
        Assert.AreEqual(left(), right());
        // Monad law 2: M.SelectMany(Monad) == M
        IO<int> M = 1.IO();
        left = M.SelectMany(m => m.IO());
        right = M;
        Assert.AreEqual(left(), right());
        // Monad law 3: M.SelectMany(f1).SelectMany(f2) == M.SelectMany(x => f1(x).SelectMany(f2))
        Func<int, IO<int>> addTwo = x => (x + 2).IO();
        left = M.SelectMany(addOne3).SelectMany(addTwo);
        right = M.SelectMany(x => addOne3(x).SelectMany(addTwo));
        Assert.AreEqual(left(), right());

        bool isExecuted5 = false;
        bool isExecuted6 = false;
        bool isExecuted7 = false;
        Func<int, IO<int>> addOne4 = x => { isExecuted5 = true; return (x + 1).IO(); };
        Func<string, IO<int>> length = x => { isExecuted6 = true; return (x.Length).IO(); };
        Func<int, Func<int, IO<string>>> f7 = x => y =>
            { isExecuted7 = true; return (new string('a', x + y)).IO(); };
        Func<int, Func<string, IO<string>>> query2 = a => b => (from x in addOne4(a).IO()
                                                                from y in length(b).IO()
                                                                from z in 0.IO()
                                                                select f7(x())(y()))();
        Assert.IsFalse(isExecuted5); // Laziness.
        Assert.IsFalse(isExecuted6); // Laziness.
        Assert.IsFalse(isExecuted7); // Laziness.
        Assert.AreEqual(new string('a', 1 + 1 + "abc".Length), query2(1)("abc")()); // Execution.
        Assert.IsTrue(isExecuted5);
        Assert.IsTrue(isExecuted6);
        Assert.IsTrue(isExecuted7);
    }
}
```