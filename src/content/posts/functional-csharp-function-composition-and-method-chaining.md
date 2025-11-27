---
title: "C# Functional Programming In-Depth (9) Function Composition and Chaining"
published: 2019-06-09
description: "As demonstrated in the introduction chapter, in object-oriented programming, program is modelled as objects, and object composition is very common, which combines simple objects to more complex object"
image: ""
tags: [".NET", "C#", "C# 3.0", "C# Features", "Functional C#", "Functional Programming", "LINQ", "LINQ via C#"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

As demonstrated in the introduction chapter, in object-oriented programming, program is modelled as objects, and object composition is very common, which combines simple objects to more complex objects. In functional programming, program is modelled as functions, function composition is emphasized, which combines simple functions to build more complex functions. LINQ query is composition of quelop.

## Forward composition and backward composition

In mathematics, function composition means to pass a first function f’s output to a second function g as input, which produces a new function h. The result function h is called composite function, it maps its argument x to g(f(x)), and is denoted g ∘ f. This notation can be read g circle f, g composed with f, or more intuitively, g after f. Since C# is strongly typed, if a first function’s output type is the same as the second function’s input type, then the first function’s output can be used to call the second function as input. So, a first function of type T -> TResult1 and a second function of type TResult1 -> TResult2 can be composed to a new function of type T -> TResult2:

internal static void OutputAsInput<T, TResult1, TResult2>(

```csharp
Func<TResult1, TResult2> second, // TResult1 -> TResult2
```
```csharp
Func<T, TResult1> first) // T ->TResult1
```
```csharp
{
```
```csharp
Func<T, TResult2> composition = value => second(first(value)); // T -> TResult2
```

}

The following example is a sequence of function calls, where a previous function’s output is passed to a next function as input:

internal static void OutputAsInput()

```csharp
{
```
```csharp
string @string = "-2";
```
```csharp
int int32 = int.Parse(@string); // string -> int
```
```csharp
int absolute = Math.Abs(int32); // int -> int
```
```csharp
double @double = Convert.ToDouble(absolute); // int -> double
```
```csharp
double squareRoot = Math.Sqrt(@double); // double -> double
```

}

The above int.Parse, Math.Abs Convert.ToDouble, and Math.Sqrt functions can be composed to a new function:

// string -> double

```csharp
internal static double Composition(string value) =>
```

Math.Sqrt(Convert.ToDouble(Math.Abs(int.Parse(value))));

C# does not have built-in composition operators to combine functions, but the composition operation can be implemented as extension methods for Func generic delegate type:

// Input: TResult1 -> TResult2, T -> TResult1.

```csharp
// Output: T -> TResult2
```
```csharp
public static Func<T, TResult2> After<T, TResult1, TResult2>(
```
```csharp
this Func<TResult1, TResult2> second, Func<T, TResult1> first) =>
```
```csharp
value => second(first(value));
```

```csharp
// Input: T -> TResult1, TResult1 -> TResult2.
```
```csharp
// Output: T -> TResult2
```
```csharp
public static Func<T, TResult2> Then<T, TResult1, TResult2>(
```
```csharp
this Func<T, TResult1> first, Func<TResult1, TResult2> second) =>
```

value => second(first(value));

And their usage is straightforward:

internal static void Composition<T, TResult1, TResult2>(

```csharp
Func<TResult1, TResult2> second, // TResult1 -> TResult2
```
```csharp
Func<T, TResult1> first) // T -> TResult1
```
```csharp
{
```
```csharp
Func<T, TResult2> composition; // T -> TResult2
```
```csharp
composition = second.After(first);
```
```csharp
// Equivalent to:
```
```csharp
composition = first.Then(second);
```

}

The above 2 extension methods work the same, they just provide different syntaxes. The After extension method implements the above ∘ operator. It composes the first function and the second function as second.After(first), where the right operand is called earlier, and the left operand is called later. Since reading code is from left to right, The Then extension method is implemented for a more readable syntax first.Then(second). Now the above int.Parse, Math.Abs Convert.ToDouble, and Math.Sqrt functions can be composed with After or Then::

internal static void BackwardCompositionForwardComposition()

```csharp
{
```
```csharp
Func<string, int> parse = int.Parse; // string -> int
```
```csharp
Func<int, int> abs = Math.Abs; // int -> int
```
```csharp
Func<int, double> convert = Convert.ToDouble; // int -> double
```
```csharp
Func<double, double> sqrt = Math.Sqrt; // double -> double
```

```csharp
// string -> double
```
```csharp
Func<string, double> backwardComposition = sqrt.After(convert).After(abs).After(parse);
```
```csharp
backwardComposition("-2").WriteLine(); // 1.4142135623731
```

```csharp
// string -> double
```
```csharp
Func<string, double> forwardComposition = parse.Then(abs).Then(convert).Then(sqrt);
```
```csharp
forwardComposition("-2").WriteLine(); // 1.4142135623731
```

}

As demonstrated above, After composes functions from right to end, which is called backward composition. Then composes function from left to right, which is called forward composition. Again, backward composition and forward composition are just different syntaxes, they produce new functions doing the same work.

If functions’ output type and input type do not match, they cannot be composed directly and their design need to be adjusted. For example, .NET Standard’s list type is designed in object-oriented paradigm. The following are a few examples of its function members:

namespace System.Collections.Generic

```csharp
{
```
```csharp
public class List<T> : ICollection<T>, IEnumerable<T>, IEnumerable, IList<T>, IReadOnlyCollection<T>, IReadOnlyList<T>, ICollection, IList
```
```csharp
{
```
```csharp
public void Add(T item); // (List<T>, T) -> void
```

```csharp
public void Clear(); // List<T> -> void
```

```csharp
public List<T> FindAll(Predicate<T> match); // (List<T>, Predicate<T>) -> List<T>
```

```csharp
public void ForEach(Action<T> action); // (List<T>, Action<T>) ->void
```

```csharp
public void RemoveAt(int index); // (List<T>, index) -> void
```

```csharp
public void Reverse(); // List<T> -> void
```

```csharp
// Other members.
```
```csharp
}
```

}

Notice FindAll accept a match function of type Predicate<T>, which is T -> bool. When FIndAll is called, it calls match function with each value in the list. If match outputs true, the value is added to the result list. Predicate<T> is equivalent to Func<T, bool>. FindAll does not use Func<T, bool> because List<T> type is released in .NET Framework 2.0, and the unified Func generic delegate types are introduced in .NET Framework 3.5. The above list functions accept different numbers of parameters. Some of them output a list and some output void. The following example operates a list in place. Apparently, these functions cannot be composed directly:

internal static void ListOperations()

```csharp
{
```
```csharp
List<int> list = new List<int>() { -2, -1, 0, 1, 2 };
```
```csharp
list.RemoveAt(0); // -> void
```
```csharp
list = list.FindAll(int32 => int32 > 0); // -> List<T>
```
```csharp
list.Reverse(); // -> void
```
```csharp
list.ForEach(int32 => int32.WriteLine()); // -> void
```
```csharp
list.Clear(); // -> void
```
```csharp
list.Add(1); // -> void
```

}

As discussed in the named function chapter, a type’s instance function member can be viewed as a static method with an additional first parameter of that type, which represents this reference to the current instance. For example, the type of Add looks like T -> void, and the type of Clear looks like () -> void, but since they are instance members, their types are actually (List<T>, T) -> void and List<T> -> void. To make these function composable. One refactor option is: If a function does not output list, have it output the result list; if a function has more parameter besides the list, swap the parameters so that the list parameter becomes the last parameter, and finally curry the function. The following are the transformed functions:

// // T -> List<T> -> List<T>

```csharp
internal static Func<List<T>, List<T>> Add<T>(T value) =>
```
```csharp
list => { list.Add(value); return list; };
```

```csharp
// List<T> -> List<T>
```
```csharp
internal static List<T> Clear<T>(List<T> list) { list.Clear(); return list; }
```

```csharp
// Predicate<T> -> List<T> ->List<T>
```
```csharp
internal static Func<List<T>, List<T>> FindAll<T>(Predicate<T> match) =>
```
```csharp
list => list.FindAll(match);
```

```csharp
// Action<T> -> List<T> ->List<T>
```
```csharp
internal static Func<List<T>, List<T>> ForEach<T>(Action<T> action) =>
```
```csharp
list => { list.ForEach(action); return list; };
```

```csharp
// int -> List<T> -> List<T>
```
```csharp
internal static Func<List<T>, List<T>> RemoveAt<T>(int index) =>
```
```csharp
list => { list.RemoveAt(index); return list; };
```

```csharp
// List<T> -> List<T>
```

internal static List<T> Reverse<T>(List<T> list) { list.Reverse(); return list; }

For example, Add is originally of type (List<T>, T) -> void. First, have Add output the manipulated list itself, which is super easy, and Add becomes (List<T>, T) ->List<T>; then swap the 2 parameters, Add becomes (T, List<T>) ->List<T>. Finally, curry Add to transformed it to T -> List<T> -> List<T>. Applying the refactor to all functions, their function types become either transformed to List<T> -> List<T>, or curried function type SomeType -> List<T> -> List<T>. Once a curried function is “partially applied” with a single argument, the result is also a function of type List<T> -> List<T>. Since all function types finally become List<T> -> List<T>, they can be composed:

internal static void TransformationForComposition()

```csharp
{
```
```csharp
// List<int> -> List<int>
```
```csharp
Func<List<int>, List<int>> removeAtWithIndex = RemoveAt<int>(0);
```
```csharp
Func<List<int>, List<int>> findAllWithPredicate = FindAll<int>(int32 => int32 > 0);
```
```csharp
Func<List<int>, List<int>> reverse = Reverse;
```
```csharp
Func<List<int>, List<int>> forEachWithAction = ForEach<int>(int32 => int32.WriteLine());
```
```csharp
Func<List<int>, List<int>> clear = Clear;
```
```csharp
Func<List<int>, List<int>> addWithValue = Add(1);
```

```csharp
Func<List<int>, List<int>> backwardComposition =
```
```csharp
addWithValue
```
```csharp
.After(clear)
```
```csharp
.After(forEachWithAction)
```
```csharp
.After(reverse)
```
```csharp
.After(findAllWithPredicate)
```
```csharp
.After(removeAtWithIndex);
```

```csharp
Func<List<int>, List<int>> forwardComposition =
```
```csharp
removeAtWithIndex
```
```csharp
.Then(findAllWithPredicate)
```
```csharp
.Then(reverse)
```
```csharp
.Then(forEachWithAction)
```
```csharp
.Then(clear)
```
```csharp
.Then(addWithValue);
```

}

So, if these functions have unified list output, and have the input list as the last parameter, then these functions can be composed with the help of partial application. This is the pattern of how to compose list operations in some functional languages:

internal static void ForwardCompositionWithPartialApplication()

```csharp
{
```
```csharp
Func<List<int>, List<int>> forwardComposition =
```
```csharp
RemoveAt<int>(0)
```
```csharp
.Then(FindAll<int>(int32 => int32 > 0))
```
```csharp
.Then(Reverse)
```
```csharp
.Then(ForEach<int>(int32 => int32.WriteLine()))
```
```csharp
.Then(Clear)
```
```csharp
.Then(Add(1));
```

```csharp
List<int> list = new List<int>() { -2, -1, 0, 1, 2 };
```
```csharp
List<int> result = forwardComposition(list);
```

}

## Forward piping

Another option to compose these functions is to use forward pipe operator, which simply forward argument to function call. Again, C# does not have built-in forward pipe operator. It can be implemented as an extension method:

// Input, T, T -> TResult.

```csharp
// Output TResult.
```

public static TResult Forward<T, TResult>(this T value, Func<T, TResult> function) =>

Its usage is also straightforward:

internal static void OutputAsInput<T, TResult1, TResult2>(

```csharp
Func<TResult1, TResult2> second, // TResult1 -> TResult2
```
```csharp
Func<T, TResult1> first, // T -> TResult1
```
```csharp
T value)
```
```csharp
{
```
```csharp
TResult2 result = value.Forward(first).Forward(second);
```

}

Here the argument is forwarded to call the first function, then forward first function’s output to call the second function as input. So, the piping can go on with the third function, the fourth function, etc. This is called forward piping. For example:

internal static void ForwardPiping()

```csharp
{
```
```csharp
double result = "-2"
```
```csharp
.Forward(int.Parse) // string -> int
```
```csharp
.Forward(Math.Abs) // int -> int
```
```csharp
.Forward(Convert.ToDouble) // int -> double
```
```csharp
.Forward(Math.Sqrt); // double -> double
```

}

To pipe functions with more parameters, just partially applied the function to result a new function with single parameter, then a single argument can be forwarded to the single parameter function. The syntax also looks similar to forward composition:

internal static void ForwardPipingWithPartialApplication()

```csharp
{
```
```csharp
List<int> result = new List<int>() { -2, -1, 0, 1, 2 }
```
```csharp
.Forward(RemoveAt<int>(1))
```
```csharp
.Forward(FindAll<int>(int32 => int32 > 0))
```
```csharp
.Forward(Reverse)
```
```csharp
.Forward(ForEach<int>(int32 => int32.WriteLine()))
```
```csharp
.Forward(Clear)
```
```csharp
.Forward(Add(1));
```

}

The above syntax looks similar to forward composition. Forward composition and forward piping both compose functions from left to right. Their difference is that forward composition starts from the first function to be composed, it does not call any composed function, and outputs a new composite function; while forward piping starts from the argument, it directly calls the composed functions, and outputs the result.

## Method chaining and fluent interface

In object-oriented programming, if a type has instance methods output that type, then these instance methods can be easily composed by just chaining the calls, for example:

internal static void InstanceMethodComposition(string @string)

```csharp
{
```
```csharp
string result = @string.Trim().Substring(1).Remove(10).ToUpperInvariant();
```

}

The above function members, Trim, Substring, Replace, ToUpperInvariant, are all instance methods of string, and they all output string. so that they can be chained. As fore mentioned, instance function member instance.Method(arg1, arg2, …) can be viewed as static function member Method(instance, arg1, arg2, …) at compile time. At runtime, unlike instance field member is allocated for each instance, instance function member is allocated only once in total just like static function member and static field member. In another word, in C#’s instance method calls syntax instance.Method(arg1, arg2, …), the . operator works like the forward pipe operator. The left side of . is a single argument for Method, the right side is the partial application of Method with other arguments. In instance method call, . just forwards the instance argument to Method function partially applied with other arguments, and finally output the result. So instance method chaining can be virtually viewed a simplified syntax of forward piping.

To compose the above list operations with method chaining. instance methods are required, and they must output list. Regarding list already have instance methods, but most of them output void, there are some options to implement method chaining. One option is to define a wrapper type to provide these instance methods for chaining:

internal class FluentList<T>

```csharp
{
```
```csharp
internal FluentList(List<T> list) => this.List = list;
```

```csharp
internal List<T> List { get; }
```

```csharp
internal FluentList<T> Add(T value) { this.List.Add(value); return this; }
```

```csharp
internal FluentList<T> Clear() { this.List.Clear(); return this; }
```

```csharp
internal FluentList<T> FindAll(Predicate<T> predicate) => new FluentList<T>(this.List.FindAll(predicate));
```

```csharp
internal FluentList<T> ForEach(Action<T> action) { this.List.ForEach(action); return this; }
```

```csharp
internal FluentList<T> RemoveAt(int index) { this.List.RemoveAt(index); return this; }
```

```csharp
internal FluentList<T> Reverse() { this.List.Reverse(); return this; }
```
```csharp
}
```

```csharp
internal static void InstanceMethodComposition()
```
```csharp
{
```
```csharp
List<int> list = new List<int>() { -2, -1, 0, 1, 2 };
```
```csharp
FluentList<int> resultWrapper = new FluentList<int>(list)
```
```csharp
.RemoveAt(0)
```
```csharp
.FindAll(int32 => int32 > 0)
```
```csharp
.Reverse()
```
```csharp
.ForEach(int32 => int32.WriteLine())
```
```csharp
.Clear()
```
```csharp
.Add(1);
```
```csharp
List<int> result = resultWrapper.List;
```

}

Since C# supports extension method, which virtually adds instance method to existing type, another option is to provide list extension methods for chaining:

internal static List<T> ExtensionAdd<T>(this List<T> list, T item)

```csharp
{ list.Add(item); return list; }
```

```csharp
internal static List<T> ExtensionClear<T>(this List<T> list)
```
```csharp
{ list.Clear(); return list; }
```

```csharp
internal static List<T> ExtensionFindAll<T>(this List<T> list, Predicate<T> predicate) =>
```
```csharp
list.FindAll(predicate);
```

```csharp
internal static List<T> ExtensionForEach<T>(this List<T> list, Action<T> action)
```
```csharp
{ list.ForEach(action); return list; }
```

```csharp
internal static List<T> ExtensionRemoveAt<T>(this List<T> list, int index)
```
```csharp
{ list.RemoveAt(index); return list; }
```

```csharp
internal static List<T> ExtensionReverse<T>(this List<T> list)
```
```csharp
{ list.Reverse(); return list; }
```

```csharp
internal static void ExtensionMethodComposition()
```
```csharp
{
```
```csharp
List<int> result = new List<int>() { -2, -1, 0, 1, 2 }
```
```csharp
.ExtensionRemoveAt(0)
```
```csharp
.ExtensionFindAll(int32 => int32 > 0)
```
```csharp
.ExtensionReverse()
```
```csharp
.ExtensionForEach(int32 => int32.WriteLine())
```
```csharp
.ExtensionClear()
```
```csharp
.ExtensionAdd(1);
```

}

As discussed in the named function chapter, extension method is compiled to static method. Similar to instance method call, the extension method calls syntax instance.ExtensionMethod(arg1, arg2, …) can also be viewed as forwarding instance argument to static function member ExtensionMethod partially applied with other arguments. The above extension method chaining is compiled to the following static method composition:

internal static void CompiledExtensionMethodComposition()

```csharp
{
```
```csharp
List<int> result =
```
```csharp
ExtensionAdd(
```
```csharp
ExtensionClear(
```
```csharp
ExtensionForEach(
```
```csharp
ExtensionReverse(
```
```csharp
ExtensionFindAll(
```
```csharp
ExtensionRemoveAt(
```
```csharp
new List<int>() { -2, -1, 0, 1, 2 },
```
```csharp
0
```
```csharp
),
```
```csharp
int32 => int32> 0
```
```csharp
)
```
```csharp
),
```
```csharp
int32 => int32.WriteLine()
```
```csharp
)
```
```csharp
),
```
```csharp
1
```
```csharp
);
```

}

For example, the previous forward piping of int. Parse, Math.Abs Convert.ToDouble, and Math.Sqrt functions can be simplified with extension methods:

internal static int ParseInt32(this string @string) => int.Parse(@string);

```csharp
internal static int Abs(this int int32) => Math.Abs(int32);
```

```csharp
internal static double ToDouble(this int int32) => Convert.ToDouble(int32);
```

```csharp
internal static double Sqrt(this double @double) => Math.Sqrt(@double);
```

```csharp
internal static void ForwardPipingWithExtensionMethod()
```
```csharp
{
```
```csharp
double result = "-2"
```
```csharp
.ParseInt32() // .Forward(int.Parse)
```
```csharp
.Abs() // .Forward(Math.Abs)
```
```csharp
.ToDouble() // .Forward(Convert.ToDouble)
```
```csharp
.Sqrt(); // .Forward(Math.Sqrt);
```

}

If an interface type supports method chaining, it is called fluent interface. For example, the following IAnimal interface has instance methods and extension method that output the interface type itself:

internal interface IAnimal

```csharp
{
```
```csharp
IAnimal Eat();
```

```csharp
IAnimal Move();
```
```csharp
}
```

```csharp
internal static class AnimalExtensions
```
```csharp
{
```
```csharp
internal static IAnimal Sleep(this IAnimal animal) => animal;
```

}

All these methods can be composed by chaining, and IAnimal is a fluent interface:

internal static void FluentInterface(IAnimal animal)

```csharp
{
```
```csharp
IAnimal result = animal.Eat().Move().Sleep();
```

}

## LINQ query composition

As demonstrated in the introduction chapter, LINQ query has 2 syntaxes, query method syntax and query expression syntax. They are both syntactic sugar for function composition.

### LINQ query method

In the query method syntax, the LINQ query APIs are composed with the extension method chaining approach of fluent interface. In LINQ, System.Collections.Generic.IEnumerable<T> interface represents a local data source (a sequence of .NET objects) to be queried, or a local LINQ query that can be executed; System.Linq.IQueryable<T> interface represents a remote data source (e.g. data rows in a database table) to be queried, or a remote LINQ query that can be executed. The IEnumerable<T>/IQueryable<T> interfaces only have a few members, and the built-in local/remote LINQ query APIs are implemented as static function members of System.Linq.Enumerable/System.Linq.Queryable static classes. Most of these functions are extension methods for IEnumerable<T>/IQueryable<T>, and many of those extension methods output IEnumerable<T>/IQueryable<T>. For example:

namespace System.Linq

```csharp
{
```
```csharp
public static class Enumerable
```
```csharp
{
```
```csharp
public static IEnumerable<TSource> Where<TSource>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```

```csharp
public static IEnumerable<TResult> Select<TSource, TResult>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TResult> selector);
```

```csharp
// Other members.
```
```csharp
}
```

```csharp
public static class Queryable
```
```csharp
{
```
```csharp
public static IQueryable<TSource> Where<TSource>(
```
```csharp
this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate);
```

```csharp
public static IQueryable<TResult> Select<TSource, TResult>(
```
```csharp
this IQueryable<TSource> source, Expression<Func<TSource, TResult>> selector);
```

```csharp
// Other members.
```
```csharp
}
```

}

This kind of functions can be composed with extension method chaining. And they make IEnumerable<T>/IQueryable<T> fluent interface.

The ordering functions are slightly different. OrderBy/OrderByDescending are extension methods of IEnumerable<T>/IQueryable<T>. However, they output IOrderedEnumerable<T>/IOrderedQueryable<T>. which represent ordered data source or ordered query, and these interfaces implement IEnumerable<T>/IQueryable<T>. LINQ also provides ThenBy/ThenByDesending to perform subsequent ordering on an ordered data source or ordered query, so ThenBy/ThenByDesending are extension methods of IOrderedEnumerable<T>/IOrderedQueryable<T>:

namespace System.Linq

```csharp
{
```

```csharp
public interface IOrderedEnumerable<out TElement> : IEnumerable<TElement>, IEnumerable
```
```csharp
{
```
```csharp
IOrderedEnumerable<TElement> CreateOrderedEnumerable<TKey>(
```
```csharp
Func<TElement, TKey> keySelector, IComparer<TKey> comparer, bool descending);
```
```csharp
}
```

```csharp
public static class Enumerable
```
```csharp
{
```
```csharp
public static IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static IOrderedEnumerable<TSource> OrderByDescending<TSource, TKey>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static IOrderedEnumerable<TSource> ThenBy<TSource, TKey>(
```
```csharp
this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static IOrderedEnumerable<TSource> ThenByDescending<TSource, TKey>(
```
```csharp
this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```
```csharp
}
```

```csharp
public interface IOrderedQueryable<out T> : IEnumerable<T>, IEnumerable, IOrderedQueryable, IQueryable, IQueryable<T>
```
```csharp
{
```
```csharp
}
```

```csharp
public static class Queryable
```
```csharp
{
```
```csharp
public static IOrderedQueryable<TSource> OrderBy<TSource, TKey>(
```
```csharp
this IQueryable<TSource> source, Expression<Func<TSource, TKey>> keySelector);
```

```csharp
public static IOrderedQueryable<TSource> OrderByDescending<TSource, TKey>(
```
```csharp
this IQueryable<TSource> source, Expression<Func<TSource, TKey>> keySelector);
```

```csharp
public static IOrderedQueryable<TSource> ThenBy<TSource, TKey>(
```
```csharp
this IOrderedQueryable<TSource> source, Expression<Func<TSource, TKey>> keySelector);
```

```csharp
public static IOrderedQueryable<TSource> ThenByDescending<TSource, TKey>(
```
```csharp
this IOrderedQueryable<TSource> source, Expression<Func<TSource, TKey>> keySelector);
```
```csharp
}
```

}

With this design, OrderBy/OrderByDescending can be chained after other query methods which output IEnumerable<T>/IQueryable<T>, but ThenBy/ThenByDesending can only be chained right after OrderBy/OrderByDescending which output IOrderedEnumerable<T>/IOrderedQueryable<T>. Regarding ThenBy/ThenByDesending perform subsequent ordering, this totally make sense. All the other non-ordering extension methods can be chained after OrderBy/OrderByDescending and ThenBy/ThenByDesending, since the output IOrderedEnumerable<T> is an IEnumerable<T> and IOrderedQueryable<T> is an IQueryable<T>.

Some APIs are not extension methods but static methods that output IEnumerable<T>. These static methods can be called to start query composition.

namespace System.Linq

```csharp
{
```
```csharp
public static class Enumerable
```
```csharp
{
```
```csharp
public static IEnumerable<TResult> Empty<TResult>();
```

```csharp
public static IEnumerable<TResult> Repeat<TResult>(TResult element, int count);
```
```csharp
}
```

}

There are other query APIs which do not output IEnumerable<T>/IQueryable<T>. They can be used to end the query composition. For example:

namespace System.Linq

```csharp
{
```
```csharp
public static class Enumerable
```
```csharp
{
```
```csharp
public static TSource First<TSource>(this IEnumerable<TSource> source);
```

```csharp
public static int Count<TSource>(this IEnumerable<TSource> source);
```
```csharp
}
```

```csharp
public static class Queryable
```
```csharp
{
```
```csharp
public static TSource First<TSource>(this IQueryable<TSource> source);
```

```csharp
public static int Count<TSource>(this IQueryable<TSource> source);
```
```csharp
}
```

}

The following is an example of query composition:

internal static void LinqComposition()

```csharp
{
```
```csharp
int queryResultCount = Enumerable
```
```csharp
.Repeat(0, 10) // -> IEnumerable<int>
```
```csharp
.Select(int32 => Path.GetRandomFileName()) // -> IEnumerable<string>
```
```csharp
.OrderByDescending(@string => @string.Length) // -> IOrderedEnumerable<string>
```
```csharp
.ThenBy(@string => @string) // -> IOrderedEnumerable<string>
```
```csharp
.Select(@string => $"{@string.Length}: {@string}") // -> IEnumerable<string>
```
```csharp
.Count(); // -> int
```

}

Apparently, the above extension method chaining is compiled to the following function composition:

internal static void CompiledLinqComposition()

```csharp
{
```
```csharp
string firstQueryResult =
```
```csharp
Enumerable.First(
```
```csharp
Enumerable.Select(
```
```csharp
Enumerable.ThenBy(
```
```csharp
Enumerable.OrderByDescending(
```
```csharp
Enumerable.Select(
```
```csharp
Enumerable.Repeat(0, 10),
```
```csharp
int32 => Path.GetRandomFileName()
```
```csharp
),
```
```csharp
@string => @string.Length
```
```csharp
),
```
```csharp
@string => @string
```
```csharp
),
```
```csharp
@string => $"{@string.Length}: {@string}"
```
```csharp
)
```
```csharp
);
```

}

So, in query method syntax, LINQ query is represented by fluent interface and query methods are composed with extension method chaining. This design makes LINQ easy to use, as well as extensible. The above built-in functions provided by Enumerable/Queryable are called LINQ standard query methods or standard query operators. Developers can also implement custom query APIs as extension methods of IEnumerable<T>/IQueryable<T> and compose built-in query methods and custom query methods by chaining. The details of local and remote LINQ query methods are discussed in the LINQ chapters.

### LINQ query expression

LINQ query expression is a SQL/XQuery-like declarative query syntactic sugar for LINQ query composition. As an expression, it is composed with clauses. The following is the syntax of query expression:

from \[Type\] rangeVariable in source

```csharp
[from [Type] rangeVariable in source]
```
```csharp
[join [Type] rangeVariable in source on outerKey equals innerKey [into rangeVariable]]
```
```csharp
[let rangeVariable = expression]
```
```csharp
[where predicate]
```
```csharp
[orderby orderingKey [ascending | descending][, orderingKey [ascending | descending], …]]
```
```csharp
select projection | group projection by groupKey [into rangeVariable
```

continuationClauses\]

A query expression must start with a from clause, and end with either a select clause or a group clause. In the middle, it can have from/join/let/where/orderby clauses. These query expression clauses introduce new language keywords to C#, which are called query keywords:

· from

· join, on, equals

· let

· where

· orderby, ascending, descending

· select

· group, by

· into

Query expression is just syntactic sugar, it is compiled to query method calls:

<table border="1" cellpadding="0" cellspacing="0" class="MsoNormalTable" style="border: currentcolor; border-image: none; border-collapse: collapse; mso-border-alt: solid black .75pt; mso-yfti-tbllook: 1184;"><tbody><tr style="mso-yfti-irow: 0; mso-yfti-firstrow: yes;"><td style="padding: 0.75pt; border: 1pt solid black; border-image: none; mso-border-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableHead" style="margin: 3pt 0in; page-break-after: avoid;">Query expression</p><font style="font-size: 12pt;"></font></td><td style="border-width: 1pt 1pt 1pt medium; border-style: solid solid solid none; border-color: black black black currentcolor; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableHead" style="margin: 3pt 0in; page-break-after: avoid;">Query method</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 1;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">Single from clause with select clause</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">Select</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 2;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">let clause</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">Select</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 3;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">Multiple from clauses with select clause</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">SelectMany</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 4;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">Type in from/join clauses</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">Cast</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 5;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">where clauses</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">Where</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 6;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">orderby clause with or without ascending</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">OrderBy, ThenBy</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 7;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">orderby clause with descending</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">OrderByDescending, ThenByDescending</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 8;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">group clause with/without into</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">GroupBy</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 9;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">join clause without into</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">Join</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 10;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">join clause with into</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">GroupJoin</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 11; mso-yfti-lastrow: yes;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">into with continuation clauses</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">Query method chaining</p><font style="font-size: 12pt;"></font></td></tr></tbody></table>

The local-variable-like identifiers declared in query expression are called range variables. The scope of range variable ends either at the end of query expression or at the into keyword that begins a continuation clause. For example:

internal static void RangeVariable(IEnumerable<int> source)

```csharp
{
```
```csharp
IEnumerable<string> query =
```
```csharp
from variable in source // variable is int.
```
```csharp
where variable > 0 // variable is int.
```
```csharp
select variable.ToString() /* variable is int. */ into variable // variable is string.
```
```csharp
orderby variable.Length // variable is string.
```
```csharp
select variable.ToUpperInvariant(); // variable is string.
```

}

The from clause declares range variable of type int, which represents each value in the int source sequence. The variable can be used in the next clauses until select clause’s into keyword. The into keyword is followed by a different range variable of type string, and can be used until the end of query, since there is no further continuation.

The following example demonstrate the syntax of each kind of clauses in local query, and the query methods they are compiled to:

internal static void QueryExpressionClause(

```csharp
IEnumerable<int> int32Sequence, IEnumerable<string> stringSequence)
```
```csharp
{
```
```csharp
IEnumerable<int> singleFromWithSelect;
```
```csharp
singleFromWithSelect = from int32 in int32Sequence
```
```csharp
select int32;
```
```csharp
// IEnumerable<TResult> Select<TSource, TResult>(this IEnumerable<TSource> source, Func<TSource, TResult> selector);
```
```csharp
singleFromWithSelect = int32Sequence.Select(int32 => int32);
```

```csharp
IEnumerable<string> let;
```
```csharp
let = from int32 in int32Sequence
```
```csharp
let variable = int32 + 1
```
```csharp
select variable.ToString();
```
```csharp
// IEnumerable<TResult> Select<TSource, TResult>(this IEnumerable<TSource> source, Func<TSource, TResult> selector);
```
```csharp
let = int32Sequence
```
```csharp
.Select(int32 => new { int32, variable = int32 + 1 })
```
```csharp
.Select(context => context.variable.ToString());
```

```csharp
IEnumerable<int> multipleFromWithSelect;
```
```csharp
multipleFromWithSelect = from int32 in int32Sequence
```
```csharp
from @string in stringSequence
```
```csharp
select int32 + @string.Length;
```
```csharp
// IEnumerable<TResult> SelectMany<TSource, TCollection, TResult>(this IEnumerable<TSource> source, Func<TSource, IEnumerable<TCollection>> collectionSelector, Func<TSource, TCollection, TResult> resultSelector);
```
```csharp
multipleFromWithSelect = int32Sequence.SelectMany(
```
```csharp
int32 => stringSequence, (int32, @string) => int32 + @string.Length);
```

```csharp
IEnumerable<DayOfWeek> typeInFrom;
```
```csharp
typeInFrom = from DayOfWeek dayOfWeek in int32Sequence
```
```csharp
select dayOfWeek;
```
```csharp
// IEnumerable<TResult> Cast<TResult>(this IEnumerable source);
```
```csharp
typeInFrom = int32Sequence.Cast<DayOfWeek>().Select(dayOfWeek => dayOfWeek);
```

```csharp
IEnumerable<int> where;
```
```csharp
where = from int32 in int32Sequence
```
```csharp
where int32 > 0
```
```csharp
select int32;
```
```csharp
// IEnumerable<TSource> Where<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```
```csharp
where = int32Sequence.Where(int32 => int32 > 0);
```

```csharp
IOrderedEnumerable<string> orderByWithSingleKey;
```
```csharp
orderByWithSingleKey = from @string in stringSequence
```
```csharp
orderby @string.Length
```
```csharp
select @string;
```
```csharp
// IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```
```csharp
orderByWithSingleKey = stringSequence.OrderBy(@string => @string.Length);
```

```csharp
IOrderedEnumerable<string> orderByWithMultipleKeys;
```
```csharp
orderByWithMultipleKeys = from @string in stringSequence
```
```csharp
orderby @string.Length, @string descending
```
```csharp
select @string;
```
```csharp
// IOrderedEnumerable<TSource> ThenByDescending<TSource, TKey>(this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```
```csharp
orderByWithMultipleKeys = stringSequence
```
```csharp
.OrderBy(@string => @string.Length).ThenByDescending(@string => @string);
```

```csharp
IEnumerable<IGrouping<int, int>> group;
```
```csharp
group = from int32 in int32Sequence
```
```csharp
group int32 by int32 % 10;
```
```csharp
// IEnumerable<IGrouping<TKey, TSource>> GroupBy<TSource, TKey>(this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```
```csharp
group = int32Sequence.GroupBy(int32 => int32 % 10);
```

```csharp
IEnumerable<IGrouping<int, string>> groupWithElementSelector;
```
```csharp
groupWithElementSelector = from int32 in int32Sequence
```
```csharp
group int32.ToString() by int32 % 10;
```
```csharp
// IEnumerable<IGrouping<TKey, TElement>> GroupBy<TSource, TKey, TElement>(this IEnumerable<TSource> source, Func<TSource, TKey> keySelector, Func<TSource, TElement> elementSelector);
```
```csharp
groupWithElementSelector = int32Sequence.GroupBy(int32 => int32 % 10, int32 => int32.ToString());
```

```csharp
IEnumerable<string> join;
```
```csharp
join = from int32 in int32Sequence
```
```csharp
join @string in stringSequence on int32 equals @string.Length
```
```csharp
select $"{int32} - {@string}";
```
```csharp
// IEnumerable<TResult> Join<TOuter, TInner, TKey, TResult>(this IEnumerable<TOuter> outer, IEnumerable<TInner> inner, Func<TOuter, TKey> outerKeySelector, Func<TInner, TKey> innerKeySelector, Func<TOuter, TInner, TResult> resultSelector);
```
```csharp
join = int32Sequence.Join(
```
```csharp
stringSequence,
```
```csharp
int32 => int32,
```
```csharp
@string => @string.Length,
```
```csharp
(int32, @string) => $"{int32} - {@string}");
```

```csharp
IEnumerable<string> joinWithInto;
```
```csharp
joinWithInto = from int32 in int32Sequence
```
```csharp
join @string in stringSequence on int32 equals @string.Length into stringGroup
```
```csharp
select $"{int32} - {string.Join(", ", stringGroup)}";
```
```csharp
// IEnumerable<TResult> GroupJoin<TOuter, TInner, TKey, TResult>(this IEnumerable<TOuter> outer, IEnumerable<TInner> inner, Func<TOuter, TKey> outerKeySelector, Func<TInner, TKey> innerKeySelector, Func<TOuter, IEnumerable<TInner>, TResult> resultSelector);
```
```csharp
joinWithInto = int32Sequence.GroupJoin(
```
```csharp
stringSequence,
```
```csharp
int32 => int32,
```
```csharp
@string => @string.Length,
```
```csharp
(int32, stringGroup) => $"{int32} - {string.Join(", ", stringGroup)}");
```

```csharp
IEnumerable<IGrouping<char, string>> intoWithContinuation;
```
```csharp
intoWithContinuation = from int32 in int32Sequence
```
```csharp
select Math.Abs(int32) into absolute
```
```csharp
select absolute.ToString() into @string
```
```csharp
group @string by @string[0];
```
```csharp
intoWithContinuation = int32Sequence
```
```csharp
.Select(int32 => Math.Abs(int32))
```
```csharp
.Select(absolute => absolute.ToString())
```
```csharp
.GroupBy(@string => @string[0]);
```

}

The compilation of remote LINQ querie expressions works in the same way. The details of these query methods are discussed in the LINQ chapters. Query expressions composed with multiple clauses is compiled to query methods composition:

internal static void QueryExpression(

```csharp
IEnumerable<int> int32Sequence, IEnumerable<string> stringSequence)
```
```csharp
{
```
```csharp
IEnumerable<IGrouping<char, ConsoleColor>> query;
```
```csharp
query = from int32 in int32Sequence
```
```csharp
from @string in stringSequence // SelectMany.
```
```csharp
let length = @string.Length // Select.
```
```csharp
where length > 1 // Where.
```
```csharp
select int32 + length
```
```csharp
into sum // Select.
```
```csharp
join ConsoleColor color in int32Sequence on sum % 15 equals (int)color // Join.
```
```csharp
orderby color // OrderBy.
```
```csharp
group color by color.ToString()[0]; // GroupBy.
```

```csharp
query = int32Sequence
```
```csharp
.SelectMany(int32 => stringSequence, (int32, @string) => new { int32, @string }) // Multiple from clauses.
```
```csharp
.Select(context => new { context, length = context.@string.Length }) // let clause.
```
```csharp
.Where(context => context.length > 1) // where clause.
```
```csharp
.Select(context => context.context.int32 + context.length) // select clause.
```
```csharp
.Join(
```
```csharp
int32Sequence.Cast<ConsoleColor>(),
```
```csharp
sum => sum % 15,
```
```csharp
color => (int)color,
```
```csharp
(sum, color) => new { sum, color }) // join clause without into.
```
```csharp
.OrderBy(context => context.color) // orderby clause.
```
```csharp
.GroupBy(
```
```csharp
context => context.color.ToString()[0],
```
```csharp
context => context.color); // group by clause without element selector.
```

}

The both LINQ syntaxes are compiled to the following function composition, where one query API’s out put is passed to another query API as input:

internal static void CompiledQueryExpression(

```csharp
IEnumerable<int> int32Sequence, IEnumerable<string> stringSequence)
```
```csharp
{
```
```csharp
IEnumerable<IGrouping<char, ConsoleColor>> query =
```
```csharp
Enumerable.GroupBy(
```
```csharp
Enumerable.OrderBy(
```
```csharp
Enumerable.Join(
```
```csharp
Enumerable.Select(
```
```csharp
Enumerable.Where(
```
```csharp
Enumerable.Select(
```
```csharp
Enumerable.SelectMany(
```
```csharp
int32Sequence, int32 => stringSequence,
```
```csharp
(int32, @string) => new { int32, @string }),
```
```csharp
context => new { context, length = context.@string.Length }
```
```csharp
),
```
```csharp
context => context.length > 1
```
```csharp
),
```
```csharp
context => context.context.int32 + context.length
```
```csharp
),
```
```csharp
Enumerable.Cast<ConsoleColor>(int32Sequence),
```
```csharp
sum => sum % 15,
```
```csharp
color => (int)color,
```
```csharp
(sum, color) => new { sum, color }
```
```csharp
),
```
```csharp
context => context.color
```
```csharp
),
```
```csharp
context => context.color.ToString()[0],
```
```csharp
context => context.color
```
```csharp
);
```

}

This comparison demonstrates that query expression and query method chaining are great syntactic sugar to write declarative and functional code.

Some tools, like Resharper, an extension for Visual Studio, utilizes C# compiler to convert query expressions to query methods at design time:

[![clip_image002](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Functional-C-6-Higher-order-Function-and_9058/clip_image002_thumb.jpg "clip_image002")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Functional-C-6-Higher-order-Function-and_9058/clip_image002_2.jpg)

## Query expression pattern

LINQ query expression is also an extensible model. In the above examples, query expression for IEnumerable<T> is compiled to calls of query method for IEnumerable<T>. Just like extension method chaining can be implemented for any type, query expression can be available for any type as well. If the compiler can find a query method exists for a type, the compiler supports the corresponding query expression clause’s syntax for that type. For example, the following example implements Select query method for int and System.Guid types:

private static TResult Select<TResult>(this int source, Func<int, TResult> selector) =>

```csharp
selector(source);
```

```csharp
private static TResult Select<TResult>(this Guid source, Func<Guid, TResult> selector) =>
```

selector(source);

Similar to Enumerable.Select for IEnumerable<T>, the above Select methods are also extension methods for int/Guid. They accept a function parameter, and output a result. Now C# compiler supports query expression of single from clause with select clause for int/Guid. The following is the query expression syntax and the equivalent query method syntax:

internal static void Select()

```csharp
{
```
```csharp
int defaultInt32;
```
```csharp
defaultInt32 = from zero in default(int)
```
```csharp
select zero;
```
```csharp
defaultInt32 = Select(default(int), zero => zero);
```

```csharp
double squareRoot;
```
```csharp
squareRoot = from three in 1 + 2
```
```csharp
select Math.Sqrt(three + 1);
```
```csharp
squareRoot = Select(1 + 2, three => Math.Sqrt(three + 1));
```

```csharp
string guidString;
```
```csharp
guidString = from guid in Guid.NewGuid()
```
```csharp
select guid.ToString();
```
```csharp
guidString = Select(Guid.NewGuid(), guid => guid.ToString());
```

}

If Where is implemented for int, then C# compiler supports where clause for int. If SelectMany is implemented for Guid, then C# compiler supports multiple from clauses for Guid:

private static int? Where(this int source, Func<int, bool> predicate) =>

```csharp
predicate(source) ? (int?)source : null;
```

```csharp
private static TResult SelectMany<TSelector, TResult>(
```
```csharp
this Guid source, Func<Guid, TSelector> selector, Func<Guid, TSelector, TResult> resultSelector)
```
```csharp
{
```
```csharp
TSelector selectorResult = selector(source);
```
```csharp
return resultSelector(source, selectorResult);
```
```csharp
}
```

```csharp
internal static void WhereAndSelectMany()
```
```csharp
{
```
```csharp
int? positive;
```
```csharp
positive = from random in new Random().Next()
```
```csharp
where random > 0
```
```csharp
select random;
```
```csharp
positive = new Random().Next().Where(random => random > 0);
```

```csharp
string doubleGuidString;
```
```csharp
doubleGuidString = from guild1 in Guid.NewGuid()
```
```csharp
from guid2 in Guid.NewGuid()
```
```csharp
select guild1.ToString() + guid2.ToString();
```
```csharp
doubleGuidString = Guid.NewGuid().SelectMany(
```
```csharp
guild1 => Guid.NewGuid(), (guild1, guid2) => guild1.ToString() + guid2.ToString());
```

}

If more query methods are implemented for a type, more query expression clauses are supported for that type. And, to compose the clauses, the query methods must be able to fluently chainable, which means their input type and output type must be matching a pattern. The following are the type designs and query method input/output designs needed to make all local LINQ query expression clauses available and composable. This is called the query expression pattern of C#:

public interface ILocal

```csharp
{
```
```csharp
ILocal<T> Cast<T>();
```
```csharp
}
```

```csharp
public interface ILocal<T> : ILocal
```
```csharp
{
```
```csharp
ILocal<TResult> Select<TResult>(Func<T, TResult> selector); // select clause.
```

```csharp
ILocal<TResult> SelectMany<TSelector, TResult>(
```
```csharp
Func<T, ILocal<TSelector>> selector,
```
```csharp
Func<T, TSelector, TResult> resultSelector); // Multiple from clause.
```

```csharp
ILocal<T> Where(Func<T, bool> predicate); // where clause.
```

```csharp
IOrderedLocal<T> OrderBy<TKey>(Func<T, TKey> keySelector); // orderby clause.
```

```csharp
IOrderedLocal<T> OrderByDescending<TKey>(Func<T, TKey> keySelector); // orderby clause with descending.
```

```csharp
ILocal<ILocalGroup<TKey, T>> GroupBy<TKey>(Func<T, TKey> keySelector); // group clause without element selector.
```

```csharp
ILocal<ILocalGroup<TKey, TElement>> GroupBy<TKey, TElement>(
```
```csharp
Func<T, TKey> keySelector, Func<T, TElement> elementSelector); // group clause with element selector.
```

```csharp
ILocal<TResult> Join<TInner, TKey, TResult>(
```
```csharp
ILocal<TInner> inner,
```
```csharp
Func<T, TKey> outerKeySelector,
```
```csharp
Func<TInner, TKey> innerKeySelector,
```
```csharp
Func<T, TInner, TResult> resultSelector); // join clause.
```

```csharp
ILocal<TResult> GroupJoin<TInner, TKey, TResult>(
```
```csharp
ILocal<TInner> inner,
```
```csharp
Func<T, TKey> outerKeySelector,
```
```csharp
Func<TInner, TKey> innerKeySelector,
```
```csharp
Func<T, ILocal<TInner>, TResult> resultSelector); // join clause with into.
```
```csharp
}
```

```csharp
public interface IOrderedLocal<T> : ILocal<T>
```
```csharp
{
```
```csharp
IOrderedLocal<T> ThenBy<TKey>(Func<T, TKey> keySelector); // Multiple keys in orderby clause.
```

```csharp
IOrderedLocal<T> ThenByDescending<TKey>(Func<T, TKey> keySelector); // Multiple keys with descending in orderby clause.
```
```csharp
}
```

```csharp
public interface ILocalGroup<TKey, T>
```
```csharp
{
```
```csharp
TKey Key { get; }
```

}

The above query methods are demonstrated as instance methods for convenience. As fore mentioned, extension methods work too. Similarly, the following type design and query method design demonstrate the remote LINQ query expression pattern, where all function parameters are replaced with corresponding expression tree parameters:

public interface IRemote

```csharp
{
```
```csharp
IRemote<T> Cast<T>();
```
```csharp
}
```

```csharp
public interface IRemote<T> : IRemote
```
```csharp
{
```
```csharp
IRemote<TResult> Select<TResult>(Expression<Func<T, TResult>> selector);
```

```csharp
IRemote<TResult> SelectMany<TSelector, TResult>(
```
```csharp
Expression<Func<T, IRemote<TSelector>>> selector,
```
```csharp
Expression<Func<T, TSelector, TResult>> resultSelector);
```

```csharp
IRemote<T> Where(Expression<Func<T, bool>> predicate);
```

```csharp
IOrderedRemote<T> OrderBy<TKey>(Expression<Func<T, TKey>> keySelector);
```

```csharp
IOrderedRemote<T> OrderByDescending<TKey>(Expression<Func<T, TKey>> keySelector);
```

```csharp
IRemote<IRemoteGroup<TKey, T>> GroupBy<TKey>(Expression<Func<T, TKey>> keySelector);
```

```csharp
IRemote<IRemoteGroup<TKey, TElement>> GroupBy<TKey, TElement>(
```
```csharp
Expression<Func<T, TKey>> keySelector, Expression<Func<T, TElement>> elementSelector);
```

```csharp
IRemote<TResult> Join<TInner, TKey, TResult>(
```
```csharp
IRemote<TInner> inner,
```
```csharp
Expression<Func<T, TKey>> outerKeySelector,
```
```csharp
Expression<Func<TInner, TKey>> innerKeySelector,
```
```csharp
Expression<Func<T, TInner, TResult>> resultSelector);
```

```csharp
IRemote<TResult> GroupJoin<TInner, TKey, TResult>(
```
```csharp
IRemote<TInner> inner,
```
```csharp
Expression<Func<T, TKey>> outerKeySelector,
```
```csharp
Expression<Func<TInner, TKey>> innerKeySelector,
```
```csharp
Expression<Func<T, IRemote<TInner>, TResult>> resultSelector);
```
```csharp
}
```

```csharp
public interface IOrderedRemote<T> : IRemote<T>
```
```csharp
{
```
```csharp
IOrderedRemote<T> ThenBy<TKey>(Expression<Func<T, TKey>> keySelector);
```

```csharp
IOrderedRemote<T> ThenByDescending<TKey>(Expression<Func<T, TKey>> keySelector);
```
```csharp
}
```

```csharp
public interface IRemoteGroup<TKey, T>
```
```csharp
{
```
```csharp
TKey Key { get; }
```

}

.NET Standard provides 3 sets of built-in query APIs, implementing the above query expression pattern:

· The IEnumerable, IEnumerable<T>, IOrderedEnumerable<T> and IGrouping<TKey, TElement> types follow the above type designs, and Enumerable’s function members follow the above query method designs and implement local sequential queries.

· The ParallelQuery, ParallelQuery<TSource>, OrderedParallelQuery<TSource> and IGrouping<TKey, TElement> types follow the above type designs, and System.Linq.ParallelEnumerable’s function members follow the above query method designs and implement local parallel queries.

· The IQueryable, IQueryable<T>, IOrderedQueryable<T> and IGrouping<TKey, TElement> types follow the above type designs, and Queryable’s function members follow the above query method designs and are used for remote queries.

The details of local sequential queries are discussed in LINQ to Objects chapters, local parallel queries are discussed in the Parallel LINQ chapters, and the remote queries are discussed in the LINQ to Entities chapters.

### Forward piping with LINQ

As fore mentioned, LINQ query method chaining or query expression is essentially function composition through forward piping. General forward piping can be also implemented by LINQ. One option is to use Select. The Select query method for IEnumerable<T> forwards each value in the IEnumerable<T> sequence to the selector function. In the previous examples, The Select query method for int/Guid forwards the int/Guid value to the selector function too. Following this pattern, a generic Select query method can be implemented for all types:

private static TResult Select<TSource, TResult>(

```csharp
this TSource source, Func<TSource, TResult> selector) =>
```

selector(source);

This version of Select becomes the same as the Forward operator, so the previous example’s Forward calls can be replaced by Select calls. For query expression, 1 Select call can be compiled from a select clause. 2 chaining Select calls can be compiled from a select clause with into and continuation of another select clauses. So the equivalent query expression version of forward piping can be by multiple select clauses with into:

internal private static TResult Select<TSource, TResult>(

```csharp
this TSource source, Func<TSource, TResult> selector) =>
```
```csharp
selector(source);
```

```csharp
internal static void ForwardPipingWithSelect()
```
```csharp
{
```
```csharp
double squareRoot;
```
```csharp
squareRoot = from @string in "-2"
```
```csharp
select int.Parse(@string) into int32
```
```csharp
select Math.Abs(int32) into absolute
```
```csharp
select Convert.ToDouble(absolute) into @double
```
```csharp
select Math.Sqrt(@double);
```
```csharp
squareRoot = "-2"
```
```csharp
.Select(int.Parse)
```
```csharp
.Select(Math.Abs)
```
```csharp
.Select(Convert.ToDouble)
```
```csharp
.Select(Math.Sqrt);
```

}

The other option is SelectMany. Instead of multiple select clauses, SelectMany enables multiple from clauses to implement forward piping. The following are the generic SelectMany query method for all types, the forward piping query expression with multiple from clauses, and the equivalent query method call version:

private static TResult SelectMany<TSource, TSelector, TResult>(

```csharp
this TSource source,
```
```csharp
Func<TSource, TSelector> selector,
```
```csharp
Func<TSource, TSelector, TResult> resultSelector)
```
```csharp
{
```
```csharp
TSelector selectorResult = selector(source);
```
```csharp
return resultSelector(source, selectorResult);
```
```csharp
}
```

```csharp
internal static void ForwardPipingWithQueryExpression()
```
```csharp
{
```
```csharp
double result;
```
```csharp
result = from @string in "-2"
```
```csharp
from int32 in int.Parse(@string)
```
```csharp
from absolute in Math.Abs(int32)
```
```csharp
from @double in Convert.ToDouble(absolute)
```
```csharp
from squareRoot in Math.Sqrt(@double)
```
```csharp
select squareRoot;
```
```csharp
result = "-2"
```
```csharp
.SelectMany(
```
```csharp
@string => int.Parse(@string),
```
```csharp
(@string, int32) => new { @string, int32 })
```
```csharp
.SelectMany(
```
```csharp
context => Math.Abs(context.int32),
```
```csharp
(context, absolute) => new { context, absolute })
```
```csharp
.SelectMany(
```
```csharp
context => Convert.ToDouble(context.absolute),
```
```csharp
(context, @double) => new { context, @double })
```
```csharp
.SelectMany(
```
```csharp
context => Math.Sqrt(context.@double),
```
```csharp
(context, squareRoot) => squareRoot);
```

}

### Query expression vs. query method

Query expression is compiled to query method calls. Query expression is declarative and intuitive, but it has 2 disadvantages. First, query expression does not cover all the built-in query methods. For example, Skip and Take query are not supported by query expression syntax:

namespace System.Linq

```csharp
{
```
```csharp
public static class Enumerable
```
```csharp
{
```
```csharp
public static IEnumerable<TSource> Skip<TSource>(this IEnumerable<TSource> source, int count);
```

```csharp
public static IEnumerable<TSource> Take<TSource>(this IEnumerable<TSource> source, int count);
```
```csharp
}
```

}

With query expression, to skip a number of values and take a number of values, a hybrid syntax has to be used:

internal static void QueryExpressionAndQueryMethod(IEnumerable<int> source)

```csharp
{
```
```csharp
IEnumerable<int> query =
```
```csharp
(from int32 in source
```
```csharp
where int32 > 0
```
```csharp
select int32)
```
```csharp
.Skip(20)
```
```csharp
.Take(10);
```

}

Second, for the covered query methods, not all query method overloads are supported. For example, Where has 2 overloads:

namespace System.Linq

```csharp
{
```
```csharp
public static class Enumerable
```
```csharp
{
```
```csharp
public static IEnumerable<TSource> Where<TSource>(this IEnumerable<TSource> source, Func<TSource, bool>predicate);
```

```csharp
public static IEnumerable<TSource> Where<TSource>(this IEnumerable<TSource> source, Func<TSource, int, bool> predicate);
```
```csharp
}
```

}

The first Where overload is supported by query expression, and can be compiled from where clause. The second overload accepts a predicate function with index input. It is not supported by query expression syntax, and can only used with query method call:

internal static void WhereWithIndex(IEnumerable<int> source)

```csharp
{
```
```csharp
IEnumerable<int> query = source.Where((int32, index) => int32> 0 && index % 2 == 0);
```

}

## Summary

This chapter discusses functional composition. In functional programming, function can be composed with forward composition, backward composition, and forward piping. In C#, LINQ query is a composition of query method, it is a forward piping implemented by extension method chaining. LINQ also supports query expression. Query expression is composed with clauses, and compiled to query methods chaining.