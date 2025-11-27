---
title: "C# Functional Programming In-Depth (9) Function Composition and Chaining"
published: 2019-06-09
description: "As demonstrated in the introduction chapter, in object-oriented programming, program is modelled as objects, and object composition is very common, which combines simple objects to more complex object"
image: ""
tags: [".NET", "C#", "C# 3.0", "LINQ", "LINQ via C#", "C# Features", "Functional Programming", "Functional C#"]
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
```
Func<TResult1, TResult2> second, // TResult1 -> TResult2
```
```
Func<T, TResult1> first) // T ->TResult1
```
```
{
```
```
Func<T, TResult2> composition = value => second(first(value)); // T -> TResult2
```

}

The following example is a sequence of function calls, where a previous function’s output is passed to a next function as input:

internal static void OutputAsInput()
```
{
```
```
string @string = "-2";
```
```
int int32 = int.Parse(@string); // string -> int
```
```
int absolute = Math.Abs(int32); // int -> int
```
```
double @double = Convert.ToDouble(absolute); // int -> double
```
```
double squareRoot = Math.Sqrt(@double); // double -> double
```

}

The above int.Parse, Math.Abs Convert.ToDouble, and Math.Sqrt functions can be composed to a new function:

// string -> double
```
internal static double Composition(string value) =>
```

Math.Sqrt(Convert.ToDouble(Math.Abs(int.Parse(value))));

C# does not have built-in composition operators to combine functions, but the composition operation can be implemented as extension methods for Func generic delegate type:

// Input: TResult1 -> TResult2, T -> TResult1.
```
// Output: T -> TResult2
```
```
public static Func<T, TResult2> After<T, TResult1, TResult2>(
```
```
this Func<TResult1, TResult2> second, Func<T, TResult1> first) =>
```
```
value => second(first(value));
```
```
// Input: T -> TResult1, TResult1 -> TResult2.
```
```
// Output: T -> TResult2
```
```
public static Func<T, TResult2> Then<T, TResult1, TResult2>(
```
```
this Func<T, TResult1> first, Func<TResult1, TResult2> second) =>
```

value => second(first(value));

And their usage is straightforward:

internal static void Composition<T, TResult1, TResult2>(
```
Func<TResult1, TResult2> second, // TResult1 -> TResult2
```
```
Func<T, TResult1> first) // T -> TResult1
```
```
{
```
```
Func<T, TResult2> composition; // T -> TResult2
```
```
composition = second.After(first);
```
```
// Equivalent to:
```
```
composition = first.Then(second);
```

}

The above 2 extension methods work the same, they just provide different syntaxes. The After extension method implements the above ∘ operator. It composes the first function and the second function as second.After(first), where the right operand is called earlier, and the left operand is called later. Since reading code is from left to right, The Then extension method is implemented for a more readable syntax first.Then(second). Now the above int.Parse, Math.Abs Convert.ToDouble, and Math.Sqrt functions can be composed with After or Then::

internal static void BackwardCompositionForwardComposition()
```
{
```
```
Func<string, int> parse = int.Parse; // string -> int
```
```
Func<int, int> abs = Math.Abs; // int -> int
```
```
Func<int, double> convert = Convert.ToDouble; // int -> double
```
```
Func<double, double> sqrt = Math.Sqrt; // double -> double
```
```
// string -> double
```
```
Func<string, double> backwardComposition = sqrt.After(convert).After(abs).After(parse);
```
```
backwardComposition("-2").WriteLine(); // 1.4142135623731
```
```
// string -> double
```
```
Func<string, double> forwardComposition = parse.Then(abs).Then(convert).Then(sqrt);
```
```
forwardComposition("-2").WriteLine(); // 1.4142135623731
```

}

As demonstrated above, After composes functions from right to end, which is called backward composition. Then composes function from left to right, which is called forward composition. Again, backward composition and forward composition are just different syntaxes, they produce new functions doing the same work.

If functions’ output type and input type do not match, they cannot be composed directly and their design need to be adjusted. For example, .NET Standard’s list type is designed in object-oriented paradigm. The following are a few examples of its function members:

namespace System.Collections.Generic
```
{
```
```csharp
public class List<T> : ICollection<T>, IEnumerable<T>, IEnumerable, IList<T>, IReadOnlyCollection<T>, IReadOnlyList<T>, ICollection, IList
```
```
{
```
```
public void Add(T item); // (List<T>, T) -> void
```
```
public void Clear(); // List<T> -> void
```
```
public List<T> FindAll(Predicate<T> match); // (List<T>, Predicate<T>) -> List<T>
```
```
public void ForEach(Action<T> action); // (List<T>, Action<T>) ->void
```
```
public void RemoveAt(int index); // (List<T>, index) -> void
```
```
public void Reverse(); // List<T> -> void
```
```
// Other members.
```
```
}
```

}

Notice FindAll accept a match function of type Predicate<T>, which is T -> bool. When FIndAll is called, it calls match function with each value in the list. If match outputs true, the value is added to the result list. Predicate<T> is equivalent to Func<T, bool>. FindAll does not use Func<T, bool> because List<T> type is released in .NET Framework 2.0, and the unified Func generic delegate types are introduced in .NET Framework 3.5. The above list functions accept different numbers of parameters. Some of them output a list and some output void. The following example operates a list in place. Apparently, these functions cannot be composed directly:

internal static void ListOperations()
```
{
```
```
List<int> list = new List<int>() { -2, -1, 0, 1, 2 };
```
```
list.RemoveAt(0); // -> void
```
```
list = list.FindAll(int32 => int32 > 0); // -> List<T>
```
```
list.Reverse(); // -> void
```
```
list.ForEach(int32 => int32.WriteLine()); // -> void
```
```
list.Clear(); // -> void
```
```
list.Add(1); // -> void
```

}

As discussed in the named function chapter, a type’s instance function member can be viewed as a static method with an additional first parameter of that type, which represents this reference to the current instance. For example, the type of Add looks like T -> void, and the type of Clear looks like () -> void, but since they are instance members, their types are actually (List<T>, T) -> void and List<T> -> void. To make these function composable. One refactor option is: If a function does not output list, have it output the result list; if a function has more parameter besides the list, swap the parameters so that the list parameter becomes the last parameter, and finally curry the function. The following are the transformed functions:

// // T -> List<T> -> List<T>
```
internal static Func<List<T>, List<T>> Add<T>(T value) =>
```
```
list => { list.Add(value); return list; };
```
```
// List<T> -> List<T>
```
```
internal static List<T> Clear<T>(List<T> list) { list.Clear(); return list; }
```
```
// Predicate<T> -> List<T> ->List<T>
```
```
internal static Func<List<T>, List<T>> FindAll<T>(Predicate<T> match) =>
```
```
list => list.FindAll(match);
```
```
// Action<T> -> List<T> ->List<T>
```
```
internal static Func<List<T>, List<T>> ForEach<T>(Action<T> action) =>
```
```
list => { list.ForEach(action); return list; };
```
```
// int -> List<T> -> List<T>
```
```
internal static Func<List<T>, List<T>> RemoveAt<T>(int index) =>
```
```
list => { list.RemoveAt(index); return list; };
```
```
// List<T> -> List<T>
```

internal static List<T> Reverse<T>(List<T> list) { list.Reverse(); return list; }

For example, Add is originally of type (List<T>, T) -> void. First, have Add output the manipulated list itself, which is super easy, and Add becomes (List<T>, T) ->List<T>; then swap the 2 parameters, Add becomes (T, List<T>) ->List<T>. Finally, curry Add to transformed it to T -> List<T> -> List<T>. Applying the refactor to all functions, their function types become either transformed to List<T> -> List<T>, or curried function type SomeType -> List<T> -> List<T>. Once a curried function is “partially applied” with a single argument, the result is also a function of type List<T> -> List<T>. Since all function types finally become List<T> -> List<T>, they can be composed:

internal static void TransformationForComposition()
```
{
```
```
// List<int> -> List<int>
```
```
Func<List<int>, List<int>> removeAtWithIndex = RemoveAt<int>(0);
```
```
Func<List<int>, List<int>> findAllWithPredicate = FindAll<int>(int32 => int32 > 0);
```
```
Func<List<int>, List<int>> reverse = Reverse;
```
```
Func<List<int>, List<int>> forEachWithAction = ForEach<int>(int32 => int32.WriteLine());
```
```
Func<List<int>, List<int>> clear = Clear;
```
```
Func<List<int>, List<int>> addWithValue = Add(1);
```
```
Func<List<int>, List<int>> backwardComposition =
```
```
addWithValue
```
```
.After(clear)
```
```
.After(forEachWithAction)
```
```
.After(reverse)
```
```
.After(findAllWithPredicate)
```
```
.After(removeAtWithIndex);
```
```
Func<List<int>, List<int>> forwardComposition =
```
```
removeAtWithIndex
```
```
.Then(findAllWithPredicate)
```
```
.Then(reverse)
```
```
.Then(forEachWithAction)
```
```
.Then(clear)
```
```
.Then(addWithValue);
```

}

So, if these functions have unified list output, and have the input list as the last parameter, then these functions can be composed with the help of partial application. This is the pattern of how to compose list operations in some functional languages:

internal static void ForwardCompositionWithPartialApplication()
```
{
```
```
Func<List<int>, List<int>> forwardComposition =
```
```
RemoveAt<int>(0)
```
```
.Then(FindAll<int>(int32 => int32 > 0))
```
```
.Then(Reverse)
```
```
.Then(ForEach<int>(int32 => int32.WriteLine()))
```
```
.Then(Clear)
```
```
.Then(Add(1));
```
```
List<int> list = new List<int>() { -2, -1, 0, 1, 2 };
```
```
List<int> result = forwardComposition(list);
```

}

## Forward piping

Another option to compose these functions is to use forward pipe operator, which simply forward argument to function call. Again, C# does not have built-in forward pipe operator. It can be implemented as an extension method:

// Input, T, T -> TResult.
```
// Output TResult.
```

public static TResult Forward<T, TResult>(this T value, Func<T, TResult> function) =>

Its usage is also straightforward:

internal static void OutputAsInput<T, TResult1, TResult2>(
```
Func<TResult1, TResult2> second, // TResult1 -> TResult2
```
```
Func<T, TResult1> first, // T -> TResult1
```
```
T value)
```
```
{
```
```
TResult2 result = value.Forward(first).Forward(second);
```

}

Here the argument is forwarded to call the first function, then forward first function’s output to call the second function as input. So, the piping can go on with the third function, the fourth function, etc. This is called forward piping. For example:

internal static void ForwardPiping()
```
{
```
```
double result = "-2"
```
```
.Forward(int.Parse) // string -> int
```
```
.Forward(Math.Abs) // int -> int
```
```
.Forward(Convert.ToDouble) // int -> double
```
```
.Forward(Math.Sqrt); // double -> double
```

}

To pipe functions with more parameters, just partially applied the function to result a new function with single parameter, then a single argument can be forwarded to the single parameter function. The syntax also looks similar to forward composition:

internal static void ForwardPipingWithPartialApplication()
```
{
```
```
List<int> result = new List<int>() { -2, -1, 0, 1, 2 }
```
```
.Forward(RemoveAt<int>(1))
```
```
.Forward(FindAll<int>(int32 => int32 > 0))
```
```
.Forward(Reverse)
```
```
.Forward(ForEach<int>(int32 => int32.WriteLine()))
```
```
.Forward(Clear)
```
```
.Forward(Add(1));
```

}

The above syntax looks similar to forward composition. Forward composition and forward piping both compose functions from left to right. Their difference is that forward composition starts from the first function to be composed, it does not call any composed function, and outputs a new composite function; while forward piping starts from the argument, it directly calls the composed functions, and outputs the result.

## Method chaining and fluent interface

In object-oriented programming, if a type has instance methods output that type, then these instance methods can be easily composed by just chaining the calls, for example:

internal static void InstanceMethodComposition(string @string)
```
{
```
```
string result = @string.Trim().Substring(1).Remove(10).ToUpperInvariant();
```

}

The above function members, Trim, Substring, Replace, ToUpperInvariant, are all instance methods of string, and they all output string. so that they can be chained. As fore mentioned, instance function member instance.Method(arg1, arg2, …) can be viewed as static function member Method(instance, arg1, arg2, …) at compile time. At runtime, unlike instance field member is allocated for each instance, instance function member is allocated only once in total just like static function member and static field member. In another word, in C#’s instance method calls syntax instance.Method(arg1, arg2, …), the . operator works like the forward pipe operator. The left side of . is a single argument for Method, the right side is the partial application of Method with other arguments. In instance method call, . just forwards the instance argument to Method function partially applied with other arguments, and finally output the result. So instance method chaining can be virtually viewed a simplified syntax of forward piping.

To compose the above list operations with method chaining. instance methods are required, and they must output list. Regarding list already have instance methods, but most of them output void, there are some options to implement method chaining. One option is to define a wrapper type to provide these instance methods for chaining:

internal class FluentList<T>
```
{
```
```
internal FluentList(List<T> list) => this.List = list;
```
```
internal List<T> List { get; }
```
```
internal FluentList<T> Add(T value) { this.List.Add(value); return this; }
```
```
internal FluentList<T> Clear() { this.List.Clear(); return this; }
```
```
internal FluentList<T> FindAll(Predicate<T> predicate) => new FluentList<T>(this.List.FindAll(predicate));
```
```
internal FluentList<T> ForEach(Action<T> action) { this.List.ForEach(action); return this; }
```
```
internal FluentList<T> RemoveAt(int index) { this.List.RemoveAt(index); return this; }
```
```
internal FluentList<T> Reverse() { this.List.Reverse(); return this; }
```
```
}
```
```
internal static void InstanceMethodComposition()
```
```
{
```
```
List<int> list = new List<int>() { -2, -1, 0, 1, 2 };
```
```
FluentList<int> resultWrapper = new FluentList<int>(list)
```
```
.RemoveAt(0)
```
```
.FindAll(int32 => int32 > 0)
```
```
.Reverse()
```
```
.ForEach(int32 => int32.WriteLine())
```
```
.Clear()
```
```
.Add(1);
```
```
List<int> result = resultWrapper.List;
```

}

Since C# supports extension method, which virtually adds instance method to existing type, another option is to provide list extension methods for chaining:

internal static List<T> ExtensionAdd<T>(this List<T> list, T item)
```
{ list.Add(item); return list; }
```
```
internal static List<T> ExtensionClear<T>(this List<T> list)
```
```
{ list.Clear(); return list; }
```
```
internal static List<T> ExtensionFindAll<T>(this List<T> list, Predicate<T> predicate) =>
```
```
list.FindAll(predicate);
```
```
internal static List<T> ExtensionForEach<T>(this List<T> list, Action<T> action)
```
```
{ list.ForEach(action); return list; }
```
```
internal static List<T> ExtensionRemoveAt<T>(this List<T> list, int index)
```
```
{ list.RemoveAt(index); return list; }
```
```
internal static List<T> ExtensionReverse<T>(this List<T> list)
```
```
{ list.Reverse(); return list; }
```
```
internal static void ExtensionMethodComposition()
```
```
{
```
```
List<int> result = new List<int>() { -2, -1, 0, 1, 2 }
```
```
.ExtensionRemoveAt(0)
```
```
.ExtensionFindAll(int32 => int32 > 0)
```
```
.ExtensionReverse()
```
```
.ExtensionForEach(int32 => int32.WriteLine())
```
```
.ExtensionClear()
```
```
.ExtensionAdd(1);
```

}

As discussed in the named function chapter, extension method is compiled to static method. Similar to instance method call, the extension method calls syntax instance.ExtensionMethod(arg1, arg2, …) can also be viewed as forwarding instance argument to static function member ExtensionMethod partially applied with other arguments. The above extension method chaining is compiled to the following static method composition:

internal static void CompiledExtensionMethodComposition()
```
{
```
```
List<int> result =
```
```
ExtensionAdd(
```
```
ExtensionClear(
```
```
ExtensionForEach(
```
```
ExtensionReverse(
```
```
ExtensionFindAll(
```
```
ExtensionRemoveAt(
```
```
new List<int>() { -2, -1, 0, 1, 2 },
```
```
0
```
```
),
```
```
int32 => int32> 0
```
```
)
```
```
),
```
```
int32 => int32.WriteLine()
```
```
)
```
```
),
```
```
1
```
```
);
```

}

For example, the previous forward piping of int. Parse, Math.Abs Convert.ToDouble, and Math.Sqrt functions can be simplified with extension methods:

internal static int ParseInt32(this string @string) => int.Parse(@string);
```
internal static int Abs(this int int32) => Math.Abs(int32);
```
```
internal static double ToDouble(this int int32) => Convert.ToDouble(int32);
```
```
internal static double Sqrt(this double @double) => Math.Sqrt(@double);
```
```
internal static void ForwardPipingWithExtensionMethod()
```
```
{
```
```
double result = "-2"
```
```
.ParseInt32() // .Forward(int.Parse)
```
```
.Abs() // .Forward(Math.Abs)
```
```
.ToDouble() // .Forward(Convert.ToDouble)
```
```
.Sqrt(); // .Forward(Math.Sqrt);
```

}

If an interface type supports method chaining, it is called fluent interface. For example, the following IAnimal interface has instance methods and extension method that output the interface type itself:

internal interface IAnimal
```
{
```
```
IAnimal Eat();
```
```
IAnimal Move();
```
```
}
```
```
internal static class AnimalExtensions
```
```
{
```
```
internal static IAnimal Sleep(this IAnimal animal) => animal;
```

}

All these methods can be composed by chaining, and IAnimal is a fluent interface:

internal static void FluentInterface(IAnimal animal)
```
{
```
```
IAnimal result = animal.Eat().Move().Sleep();
```

}

## LINQ query composition

As demonstrated in the introduction chapter, LINQ query has 2 syntaxes, query method syntax and query expression syntax. They are both syntactic sugar for function composition.

### LINQ query method

In the query method syntax, the LINQ query APIs are composed with the extension method chaining approach of fluent interface. In LINQ, System.Collections.Generic.IEnumerable<T> interface represents a local data source (a sequence of .NET objects) to be queried, or a local LINQ query that can be executed; System.Linq.IQueryable<T> interface represents a remote data source (e.g. data rows in a database table) to be queried, or a remote LINQ query that can be executed. The IEnumerable<T>/IQueryable<T> interfaces only have a few members, and the built-in local/remote LINQ query APIs are implemented as static function members of System.Linq.Enumerable/System.Linq.Queryable static classes. Most of these functions are extension methods for IEnumerable<T>/IQueryable<T>, and many of those extension methods output IEnumerable<T>/IQueryable<T>. For example:

namespace System.Linq
```
{
```
```
public static class Enumerable
```
```
{
```
```
public static IEnumerable<TSource> Where<TSource>(
```
```
this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```
```
public static IEnumerable<TResult> Select<TSource, TResult>(
```
```
this IEnumerable<TSource> source, Func<TSource, TResult> selector);
```
```
// Other members.
```
```
}
```
```
public static class Queryable
```
```
{
```
```
public static IQueryable<TSource> Where<TSource>(
```
```
this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate);
```
```
public static IQueryable<TResult> Select<TSource, TResult>(
```
```
this IQueryable<TSource> source, Expression<Func<TSource, TResult>> selector);
```
```
// Other members.
```
```
}
```

}

This kind of functions can be composed with extension method chaining. And they make IEnumerable<T>/IQueryable<T> fluent interface.

The ordering functions are slightly different. OrderBy/OrderByDescending are extension methods of IEnumerable<T>/IQueryable<T>. However, they output IOrderedEnumerable<T>/IOrderedQueryable<T>. which represent ordered data source or ordered query, and these interfaces implement IEnumerable<T>/IQueryable<T>. LINQ also provides ThenBy/ThenByDesending to perform subsequent ordering on an ordered data source or ordered query, so ThenBy/ThenByDesending are extension methods of IOrderedEnumerable<T>/IOrderedQueryable<T>:

namespace System.Linq
```
{
```
```
public interface IOrderedEnumerable<out TElement> : IEnumerable<TElement>, IEnumerable
```
```
{
```
```
IOrderedEnumerable<TElement> CreateOrderedEnumerable<TKey>(
```
```
Func<TElement, TKey> keySelector, IComparer<TKey> comparer, bool descending);
```
```
}
```
```
public static class Enumerable
```
```
{
```
```
public static IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(
```
```
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```
```
public static IOrderedEnumerable<TSource> OrderByDescending<TSource, TKey>(
```
```
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```
```
public static IOrderedEnumerable<TSource> ThenBy<TSource, TKey>(
```
```
this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```
```
public static IOrderedEnumerable<TSource> ThenByDescending<TSource, TKey>(
```
```
this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```
```
}
```
```
public interface IOrderedQueryable<out T> : IEnumerable<T>, IEnumerable, IOrderedQueryable, IQueryable, IQueryable<T>
```
```
{
```
```
}
```
```
public static class Queryable
```
```
{
```
```
public static IOrderedQueryable<TSource> OrderBy<TSource, TKey>(
```
```
this IQueryable<TSource> source, Expression<Func<TSource, TKey>> keySelector);
```
```
public static IOrderedQueryable<TSource> OrderByDescending<TSource, TKey>(
```
```
this IQueryable<TSource> source, Expression<Func<TSource, TKey>> keySelector);
```
```
public static IOrderedQueryable<TSource> ThenBy<TSource, TKey>(
```
```
this IOrderedQueryable<TSource> source, Expression<Func<TSource, TKey>> keySelector);
```
```
public static IOrderedQueryable<TSource> ThenByDescending<TSource, TKey>(
```
```
this IOrderedQueryable<TSource> source, Expression<Func<TSource, TKey>> keySelector);
```
```
}
```

}

With this design, OrderBy/OrderByDescending can be chained after other query methods which output IEnumerable<T>/IQueryable<T>, but ThenBy/ThenByDesending can only be chained right after OrderBy/OrderByDescending which output IOrderedEnumerable<T>/IOrderedQueryable<T>. Regarding ThenBy/ThenByDesending perform subsequent ordering, this totally make sense. All the other non-ordering extension methods can be chained after OrderBy/OrderByDescending and ThenBy/ThenByDesending, since the output IOrderedEnumerable<T> is an IEnumerable<T> and IOrderedQueryable<T> is an IQueryable<T>.

Some APIs are not extension methods but static methods that output IEnumerable<T>. These static methods can be called to start query composition.

namespace System.Linq
```
{
```
```
public static class Enumerable
```
```
{
```
```
public static IEnumerable<TResult> Empty<TResult>();
```
```
public static IEnumerable<TResult> Repeat<TResult>(TResult element, int count);
```
```
}
```

}

There are other query APIs which do not output IEnumerable<T>/IQueryable<T>. They can be used to end the query composition. For example:

namespace System.Linq
```
{
```
```
public static class Enumerable
```
```
{
```
```
public static TSource First<TSource>(this IEnumerable<TSource> source);
```
```
public static int Count<TSource>(this IEnumerable<TSource> source);
```
```
}
```
```
public static class Queryable
```
```
{
```
```
public static TSource First<TSource>(this IQueryable<TSource> source);
```
```
public static int Count<TSource>(this IQueryable<TSource> source);
```
```
}
```

}

The following is an example of query composition:

internal static void LinqComposition()
```
{
```
```
int queryResultCount = Enumerable
```
```
.Repeat(0, 10) // -> IEnumerable<int>
```
```
.Select(int32 => Path.GetRandomFileName()) // -> IEnumerable<string>
```
```
.OrderByDescending(@string => @string.Length) // -> IOrderedEnumerable<string>
```
```
.ThenBy(@string => @string) // -> IOrderedEnumerable<string>
```
```
.Select(@string => $"{@string.Length}: {@string}") // -> IEnumerable<string>
```
```
.Count(); // -> int
```

}

Apparently, the above extension method chaining is compiled to the following function composition:

internal static void CompiledLinqComposition()
```
{
```
```
string firstQueryResult =
```
```
Enumerable.First(
```
```
Enumerable.Select(
```
```
Enumerable.ThenBy(
```
```
Enumerable.OrderByDescending(
```
```
Enumerable.Select(
```
```
Enumerable.Repeat(0, 10),
```
```
int32 => Path.GetRandomFileName()
```
```
),
```
```
@string => @string.Length
```
```
),
```
```
@string => @string
```
```
),
```
```
@string => $"{@string.Length}: {@string}"
```
```
)
```
```
);
```

}

So, in query method syntax, LINQ query is represented by fluent interface and query methods are composed with extension method chaining. This design makes LINQ easy to use, as well as extensible. The above built-in functions provided by Enumerable/Queryable are called LINQ standard query methods or standard query operators. Developers can also implement custom query APIs as extension methods of IEnumerable<T>/IQueryable<T> and compose built-in query methods and custom query methods by chaining. The details of local and remote LINQ query methods are discussed in the LINQ chapters.

### LINQ query expression

LINQ query expression is a SQL/XQuery-like declarative query syntactic sugar for LINQ query composition. As an expression, it is composed with clauses. The following is the syntax of query expression:

from \[Type\] rangeVariable in source
```
[from [Type] rangeVariable in source]
```
```
[join [Type] rangeVariable in source on outerKey equals innerKey [into rangeVariable]]
```
```
[let rangeVariable = expression]
```
```
[where predicate]
```
```
[orderby orderingKey [ascending | descending][, orderingKey [ascending | descending], …]]
```
```
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
```
{
```
```
IEnumerable<string> query =
```
```
from variable in source // variable is int.
```
```
where variable > 0 // variable is int.
```
```
select variable.ToString() /* variable is int. */ into variable // variable is string.
```
```
orderby variable.Length // variable is string.
```
```
select variable.ToUpperInvariant(); // variable is string.
```

}

The from clause declares range variable of type int, which represents each value in the int source sequence. The variable can be used in the next clauses until select clause’s into keyword. The into keyword is followed by a different range variable of type string, and can be used until the end of query, since there is no further continuation.

The following example demonstrate the syntax of each kind of clauses in local query, and the query methods they are compiled to:

internal static void QueryExpressionClause(
```
IEnumerable<int> int32Sequence, IEnumerable<string> stringSequence)
```
```
{
```
```
IEnumerable<int> singleFromWithSelect;
```
```
singleFromWithSelect = from int32 in int32Sequence
```
```
select int32;
```
```
// IEnumerable<TResult> Select<TSource, TResult>(this IEnumerable<TSource> source, Func<TSource, TResult> selector);
```
```
singleFromWithSelect = int32Sequence.Select(int32 => int32);
```
```
IEnumerable<string> let;
```
```
let = from int32 in int32Sequence
```
```
let variable = int32 + 1
```
```
select variable.ToString();
```
```
// IEnumerable<TResult> Select<TSource, TResult>(this IEnumerable<TSource> source, Func<TSource, TResult> selector);
```
```
let = int32Sequence
```
```
.Select(int32 => new { int32, variable = int32 + 1 })
```
```
.Select(context => context.variable.ToString());
```
```
IEnumerable<int> multipleFromWithSelect;
```
```
multipleFromWithSelect = from int32 in int32Sequence
```
```
from @string in stringSequence
```
```
select int32 + @string.Length;
```
```
// IEnumerable<TResult> SelectMany<TSource, TCollection, TResult>(this IEnumerable<TSource> source, Func<TSource, IEnumerable<TCollection>> collectionSelector, Func<TSource, TCollection, TResult> resultSelector);
```
```
multipleFromWithSelect = int32Sequence.SelectMany(
```
```
int32 => stringSequence, (int32, @string) => int32 + @string.Length);
```
```
IEnumerable<DayOfWeek> typeInFrom;
```
```
typeInFrom = from DayOfWeek dayOfWeek in int32Sequence
```
```
select dayOfWeek;
```
```
// IEnumerable<TResult> Cast<TResult>(this IEnumerable source);
```
```
typeInFrom = int32Sequence.Cast<DayOfWeek>().Select(dayOfWeek => dayOfWeek);
```
```
IEnumerable<int> where;
```
```
where = from int32 in int32Sequence
```
```
where int32 > 0
```
```
select int32;
```
```
// IEnumerable<TSource> Where<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```
```
where = int32Sequence.Where(int32 => int32 > 0);
```
```
IOrderedEnumerable<string> orderByWithSingleKey;
```
```
orderByWithSingleKey = from @string in stringSequence
```
```
orderby @string.Length
```
```
select @string;
```
```
// IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```
```
orderByWithSingleKey = stringSequence.OrderBy(@string => @string.Length);
```
```
IOrderedEnumerable<string> orderByWithMultipleKeys;
```
```
orderByWithMultipleKeys = from @string in stringSequence
```
```
orderby @string.Length, @string descending
```
```
select @string;
```
```
// IOrderedEnumerable<TSource> ThenByDescending<TSource, TKey>(this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```
```
orderByWithMultipleKeys = stringSequence
```
```
.OrderBy(@string => @string.Length).ThenByDescending(@string => @string);
```
```
IEnumerable<IGrouping<int, int>> group;
```
```
group = from int32 in int32Sequence
```
```
group int32 by int32 % 10;
```
```
// IEnumerable<IGrouping<TKey, TSource>> GroupBy<TSource, TKey>(this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```
```
group = int32Sequence.GroupBy(int32 => int32 % 10);
```
```
IEnumerable<IGrouping<int, string>> groupWithElementSelector;
```
```
groupWithElementSelector = from int32 in int32Sequence
```
```
group int32.ToString() by int32 % 10;
```
```
// IEnumerable<IGrouping<TKey, TElement>> GroupBy<TSource, TKey, TElement>(this IEnumerable<TSource> source, Func<TSource, TKey> keySelector, Func<TSource, TElement> elementSelector);
```
```
groupWithElementSelector = int32Sequence.GroupBy(int32 => int32 % 10, int32 => int32.ToString());
```
```
IEnumerable<string> join;
```
```
join = from int32 in int32Sequence
```
```
join @string in stringSequence on int32 equals @string.Length
```
```
select $"{int32} - {@string}";
```
```
// IEnumerable<TResult> Join<TOuter, TInner, TKey, TResult>(this IEnumerable<TOuter> outer, IEnumerable<TInner> inner, Func<TOuter, TKey> outerKeySelector, Func<TInner, TKey> innerKeySelector, Func<TOuter, TInner, TResult> resultSelector);
```
```
join = int32Sequence.Join(
```
```
stringSequence,
```
```
int32 => int32,
```
```
@string => @string.Length,
```
```
(int32, @string) => $"{int32} - {@string}");
```
```
IEnumerable<string> joinWithInto;
```
```
joinWithInto = from int32 in int32Sequence
```
```
join @string in stringSequence on int32 equals @string.Length into stringGroup
```
```
select $"{int32} - {string.Join(", ", stringGroup)}";
```
```
// IEnumerable<TResult> GroupJoin<TOuter, TInner, TKey, TResult>(this IEnumerable<TOuter> outer, IEnumerable<TInner> inner, Func<TOuter, TKey> outerKeySelector, Func<TInner, TKey> innerKeySelector, Func<TOuter, IEnumerable<TInner>, TResult> resultSelector);
```
```
joinWithInto = int32Sequence.GroupJoin(
```
```
stringSequence,
```
```
int32 => int32,
```
```
@string => @string.Length,
```
```
(int32, stringGroup) => $"{int32} - {string.Join(", ", stringGroup)}");
```
```
IEnumerable<IGrouping<char, string>> intoWithContinuation;
```
```
intoWithContinuation = from int32 in int32Sequence
```
```
select Math.Abs(int32) into absolute
```
```
select absolute.ToString() into @string
```
```
group @string by @string[0];
```
```
intoWithContinuation = int32Sequence
```
```
.Select(int32 => Math.Abs(int32))
```
```
.Select(absolute => absolute.ToString())
```
```
.GroupBy(@string => @string[0]);
```

}

The compilation of remote LINQ querie expressions works in the same way. The details of these query methods are discussed in the LINQ chapters. Query expressions composed with multiple clauses is compiled to query methods composition:

internal static void QueryExpression(
```
IEnumerable<int> int32Sequence, IEnumerable<string> stringSequence)
```
```
{
```
```
IEnumerable<IGrouping<char, ConsoleColor>> query;
```
```
query = from int32 in int32Sequence
```
```
from @string in stringSequence // SelectMany.
```
```
let length = @string.Length // Select.
```
```
where length > 1 // Where.
```
```
select int32 + length
```
```
into sum // Select.
```
```
join ConsoleColor color in int32Sequence on sum % 15 equals (int)color // Join.
```
```
orderby color // OrderBy.
```
```
group color by color.ToString()[0]; // GroupBy.
```
```
query = int32Sequence
```
```
.SelectMany(int32 => stringSequence, (int32, @string) => new { int32, @string }) // Multiple from clauses.
```
```
.Select(context => new { context, length = context.@string.Length }) // let clause.
```
```
.Where(context => context.length > 1) // where clause.
```
```
.Select(context => context.context.int32 + context.length) // select clause.
```
```
.Join(
```
```
int32Sequence.Cast<ConsoleColor>(),
```
```
sum => sum % 15,
```
```
color => (int)color,
```
```
(sum, color) => new { sum, color }) // join clause without into.
```
```
.OrderBy(context => context.color) // orderby clause.
```
```
.GroupBy(
```
```
context => context.color.ToString()[0],
```
```
context => context.color); // group by clause without element selector.
```

}

The both LINQ syntaxes are compiled to the following function composition, where one query API’s out put is passed to another query API as input:

internal static void CompiledQueryExpression(
```
IEnumerable<int> int32Sequence, IEnumerable<string> stringSequence)
```
```
{
```
```
IEnumerable<IGrouping<char, ConsoleColor>> query =
```
```
Enumerable.GroupBy(
```
```
Enumerable.OrderBy(
```
```
Enumerable.Join(
```
```
Enumerable.Select(
```
```
Enumerable.Where(
```
```
Enumerable.Select(
```
```
Enumerable.SelectMany(
```
```
int32Sequence, int32 => stringSequence,
```
```
(int32, @string) => new { int32, @string }),
```
```
context => new { context, length = context.@string.Length }
```
```
),
```
```
context => context.length > 1
```
```
),
```
```
context => context.context.int32 + context.length
```
```
),
```
```
Enumerable.Cast<ConsoleColor>(int32Sequence),
```
```
sum => sum % 15,
```
```
color => (int)color,
```
```
(sum, color) => new { sum, color }
```
```
),
```
```
context => context.color
```
```
),
```
```
context => context.color.ToString()[0],
```
```
context => context.color
```
```
);
```

}

This comparison demonstrates that query expression and query method chaining are great syntactic sugar to write declarative and functional code.

Some tools, like Resharper, an extension for Visual Studio, utilizes C# compiler to convert query expressions to query methods at design time:

[![clip_image002](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Functional-C-6-Higher-order-Function-and_9058/clip_image002_thumb.jpg "clip_image002")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Functional-C-6-Higher-order-Function-and_9058/clip_image002_2.jpg)

## Query expression pattern

LINQ query expression is also an extensible model. In the above examples, query expression for IEnumerable<T> is compiled to calls of query method for IEnumerable<T>. Just like extension method chaining can be implemented for any type, query expression can be available for any type as well. If the compiler can find a query method exists for a type, the compiler supports the corresponding query expression clause’s syntax for that type. For example, the following example implements Select query method for int and System.Guid types:

private static TResult Select<TResult>(this int source, Func<int, TResult> selector) =>
```
selector(source);
```

```csharp
private static TResult Select<TResult>(this Guid source, Func<Guid, TResult> selector) =>
```

selector(source);

Similar to Enumerable.Select for IEnumerable<T>, the above Select methods are also extension methods for int/Guid. They accept a function parameter, and output a result. Now C# compiler supports query expression of single from clause with select clause for int/Guid. The following is the query expression syntax and the equivalent query method syntax:

internal static void Select()
```
{
```
```
int defaultInt32;
```
```
defaultInt32 = from zero in default(int)
```
```
select zero;
```
```
defaultInt32 = Select(default(int), zero => zero);
```
```
double squareRoot;
```
```
squareRoot = from three in 1 + 2
```
```
select Math.Sqrt(three + 1);
```
```
squareRoot = Select(1 + 2, three => Math.Sqrt(three + 1));
```
```
string guidString;
```
```
guidString = from guid in Guid.NewGuid()
```
```
select guid.ToString();
```
```
guidString = Select(Guid.NewGuid(), guid => guid.ToString());
```

}

If Where is implemented for int, then C# compiler supports where clause for int. If SelectMany is implemented for Guid, then C# compiler supports multiple from clauses for Guid:

private static int? Where(this int source, Func<int, bool> predicate) =>
```
predicate(source) ? (int?)source : null;
```

```csharp
private static TResult SelectMany<TSelector, TResult>(
```
```
this Guid source, Func<Guid, TSelector> selector, Func<Guid, TSelector, TResult> resultSelector)
```
```
{
```
```
TSelector selectorResult = selector(source);
```
```
return resultSelector(source, selectorResult);
```
```
}
```
```
internal static void WhereAndSelectMany()
```
```
{
```
```
int? positive;
```
```
positive = from random in new Random().Next()
```
```
where random > 0
```
```
select random;
```
```
positive = new Random().Next().Where(random => random > 0);
```
```
string doubleGuidString;
```
```
doubleGuidString = from guild1 in Guid.NewGuid()
```
```
from guid2 in Guid.NewGuid()
```
```
select guild1.ToString() + guid2.ToString();
```
```
doubleGuidString = Guid.NewGuid().SelectMany(
```
```
guild1 => Guid.NewGuid(), (guild1, guid2) => guild1.ToString() + guid2.ToString());
```

}

If more query methods are implemented for a type, more query expression clauses are supported for that type. And, to compose the clauses, the query methods must be able to fluently chainable, which means their input type and output type must be matching a pattern. The following are the type designs and query method input/output designs needed to make all local LINQ query expression clauses available and composable. This is called the query expression pattern of C#:

public interface ILocal
```
{
```
```
ILocal<T> Cast<T>();
```
```
}
```
```
public interface ILocal<T> : ILocal
```
```
{
```
```
ILocal<TResult> Select<TResult>(Func<T, TResult> selector); // select clause.
```
```
ILocal<TResult> SelectMany<TSelector, TResult>(
```
```
Func<T, ILocal<TSelector>> selector,
```
```
Func<T, TSelector, TResult> resultSelector); // Multiple from clause.
```
```
ILocal<T> Where(Func<T, bool> predicate); // where clause.
```
```
IOrderedLocal<T> OrderBy<TKey>(Func<T, TKey> keySelector); // orderby clause.
```
```
IOrderedLocal<T> OrderByDescending<TKey>(Func<T, TKey> keySelector); // orderby clause with descending.
```
```
ILocal<ILocalGroup<TKey, T>> GroupBy<TKey>(Func<T, TKey> keySelector); // group clause without element selector.
```
```
ILocal<ILocalGroup<TKey, TElement>> GroupBy<TKey, TElement>(
```
```
Func<T, TKey> keySelector, Func<T, TElement> elementSelector); // group clause with element selector.
```
```
ILocal<TResult> Join<TInner, TKey, TResult>(
```
```
ILocal<TInner> inner,
```
```
Func<T, TKey> outerKeySelector,
```
```
Func<TInner, TKey> innerKeySelector,
```
```
Func<T, TInner, TResult> resultSelector); // join clause.
```
```
ILocal<TResult> GroupJoin<TInner, TKey, TResult>(
```
```
ILocal<TInner> inner,
```
```
Func<T, TKey> outerKeySelector,
```
```
Func<TInner, TKey> innerKeySelector,
```
```
Func<T, ILocal<TInner>, TResult> resultSelector); // join clause with into.
```
```
}
```
```
public interface IOrderedLocal<T> : ILocal<T>
```
```
{
```
```
IOrderedLocal<T> ThenBy<TKey>(Func<T, TKey> keySelector); // Multiple keys in orderby clause.
```
```
IOrderedLocal<T> ThenByDescending<TKey>(Func<T, TKey> keySelector); // Multiple keys with descending in orderby clause.
```
```
}
```
```
public interface ILocalGroup<TKey, T>
```
```
{
```
```
TKey Key { get; }
```

}

The above query methods are demonstrated as instance methods for convenience. As fore mentioned, extension methods work too. Similarly, the following type design and query method design demonstrate the remote LINQ query expression pattern, where all function parameters are replaced with corresponding expression tree parameters:

public interface IRemote
```
{
```
```
IRemote<T> Cast<T>();
```
```
}
```
```
public interface IRemote<T> : IRemote
```
```
{
```
```
IRemote<TResult> Select<TResult>(Expression<Func<T, TResult>> selector);
```
```
IRemote<TResult> SelectMany<TSelector, TResult>(
```
```
Expression<Func<T, IRemote<TSelector>>> selector,
```
```
Expression<Func<T, TSelector, TResult>> resultSelector);
```
```
IRemote<T> Where(Expression<Func<T, bool>> predicate);
```
```
IOrderedRemote<T> OrderBy<TKey>(Expression<Func<T, TKey>> keySelector);
```
```
IOrderedRemote<T> OrderByDescending<TKey>(Expression<Func<T, TKey>> keySelector);
```
```
IRemote<IRemoteGroup<TKey, T>> GroupBy<TKey>(Expression<Func<T, TKey>> keySelector);
```
```
IRemote<IRemoteGroup<TKey, TElement>> GroupBy<TKey, TElement>(
```
```
Expression<Func<T, TKey>> keySelector, Expression<Func<T, TElement>> elementSelector);
```
```
IRemote<TResult> Join<TInner, TKey, TResult>(
```
```
IRemote<TInner> inner,
```
```
Expression<Func<T, TKey>> outerKeySelector,
```
```
Expression<Func<TInner, TKey>> innerKeySelector,
```
```
Expression<Func<T, TInner, TResult>> resultSelector);
```
```
IRemote<TResult> GroupJoin<TInner, TKey, TResult>(
```
```
IRemote<TInner> inner,
```
```
Expression<Func<T, TKey>> outerKeySelector,
```
```
Expression<Func<TInner, TKey>> innerKeySelector,
```
```
Expression<Func<T, IRemote<TInner>, TResult>> resultSelector);
```
```
}
```
```
public interface IOrderedRemote<T> : IRemote<T>
```
```
{
```
```
IOrderedRemote<T> ThenBy<TKey>(Expression<Func<T, TKey>> keySelector);
```
```
IOrderedRemote<T> ThenByDescending<TKey>(Expression<Func<T, TKey>> keySelector);
```
```
}
```
```
public interface IRemoteGroup<TKey, T>
```
```
{
```
```
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
```
this TSource source, Func<TSource, TResult> selector) =>
```

selector(source);

This version of Select becomes the same as the Forward operator, so the previous example’s Forward calls can be replaced by Select calls. For query expression, 1 Select call can be compiled from a select clause. 2 chaining Select calls can be compiled from a select clause with into and continuation of another select clauses. So the equivalent query expression version of forward piping can be by multiple select clauses with into:

internal private static TResult Select<TSource, TResult>(
```
this TSource source, Func<TSource, TResult> selector) =>
```
```
selector(source);
```
```
internal static void ForwardPipingWithSelect()
```
```
{
```
```
double squareRoot;
```
```
squareRoot = from @string in "-2"
```
```
select int.Parse(@string) into int32
```
```
select Math.Abs(int32) into absolute
```
```
select Convert.ToDouble(absolute) into @double
```
```
select Math.Sqrt(@double);
```
```
squareRoot = "-2"
```
```
.Select(int.Parse)
```
```
.Select(Math.Abs)
```
```
.Select(Convert.ToDouble)
```
```
.Select(Math.Sqrt);
```

}

The other option is SelectMany. Instead of multiple select clauses, SelectMany enables multiple from clauses to implement forward piping. The following are the generic SelectMany query method for all types, the forward piping query expression with multiple from clauses, and the equivalent query method call version:

private static TResult SelectMany<TSource, TSelector, TResult>(
```
this TSource source,
```
```
Func<TSource, TSelector> selector,
```
```
Func<TSource, TSelector, TResult> resultSelector)
```
```
{
```
```
TSelector selectorResult = selector(source);
```
```
return resultSelector(source, selectorResult);
```
```
}
```
```
internal static void ForwardPipingWithQueryExpression()
```
```
{
```
```
double result;
```
```
result = from @string in "-2"
```
```
from int32 in int.Parse(@string)
```
```
from absolute in Math.Abs(int32)
```
```
from @double in Convert.ToDouble(absolute)
```
```
from squareRoot in Math.Sqrt(@double)
```
```
select squareRoot;
```
```
result = "-2"
```
```
.SelectMany(
```
```
@string => int.Parse(@string),
```
```
(@string, int32) => new { @string, int32 })
```
```
.SelectMany(
```
```
context => Math.Abs(context.int32),
```
```
(context, absolute) => new { context, absolute })
```
```
.SelectMany(
```
```
context => Convert.ToDouble(context.absolute),
```
```
(context, @double) => new { context, @double })
```
```
.SelectMany(
```
```
context => Math.Sqrt(context.@double),
```
```
(context, squareRoot) => squareRoot);
```

}

### Query expression vs. query method

Query expression is compiled to query method calls. Query expression is declarative and intuitive, but it has 2 disadvantages. First, query expression does not cover all the built-in query methods. For example, Skip and Take query are not supported by query expression syntax:

namespace System.Linq
```
{
```
```
public static class Enumerable
```
```
{
```
```
public static IEnumerable<TSource> Skip<TSource>(this IEnumerable<TSource> source, int count);
```
```
public static IEnumerable<TSource> Take<TSource>(this IEnumerable<TSource> source, int count);
```
```
}
```

}

With query expression, to skip a number of values and take a number of values, a hybrid syntax has to be used:

internal static void QueryExpressionAndQueryMethod(IEnumerable<int> source)
```
{
```
```
IEnumerable<int> query =
```
```
(from int32 in source
```
```
where int32 > 0
```
```
select int32)
```
```
.Skip(20)
```
```
.Take(10);
```

}

Second, for the covered query methods, not all query method overloads are supported. For example, Where has 2 overloads:

namespace System.Linq
```
{
```
```
public static class Enumerable
```
```
{
```
```
public static IEnumerable<TSource> Where<TSource>(this IEnumerable<TSource> source, Func<TSource, bool>predicate);
```
```
public static IEnumerable<TSource> Where<TSource>(this IEnumerable<TSource> source, Func<TSource, int, bool> predicate);
```
```
}
```

}

The first Where overload is supported by query expression, and can be compiled from where clause. The second overload accepts a predicate function with index input. It is not supported by query expression syntax, and can only used with query method call:

internal static void WhereWithIndex(IEnumerable<int> source)
```
{
```
```
IEnumerable<int> query = source.Where((int32, index) => int32> 0 && index % 2 == 0);
```

}

## Summary

This chapter discusses functional composition. In functional programming, function can be composed with forward composition, backward composition, and forward piping. In C#, LINQ query is a composition of query method, it is a forward piping implemented by extension method chaining. LINQ also supports query expression. Query expression is composed with clauses, and compiled to query methods chaining.