---
title: "C# Functional Programming In-Depth (11) Covariance and Contravariance"
published: 2018-06-11
description: "In ), variance means the capability to substitute a type with a more derived type or les"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

## **Latest version: [https://weblogs.asp.net/dixin/functional-csharp-covariance-and-contravariance](/posts/functional-csharp-covariance-and-contravariance "https://weblogs.asp.net/dixin/functional-csharp-covariance-and-contravariance")**[](/posts/functional-csharp-fundamentals "https://weblogs.asp.net/dixin/functional-csharp-fundamentals")

In [covariance and contravariance](https://en.wikipedia.org/wiki/Covariance_and_contravariance_\(computer_science\)), variance means the capability to substitute a type with a more derived type or less derived type in a context. The following is a simple [inheritance hierarchy](https://msdn.microsoft.com/en-us/library/27db6csx.aspx):
```
internal class Base { }

internal class Derived : Base { }
```

Base is a less derived type, and Derived is a more derived type. So a Derived instance “[is a](https://en.wikipedia.org/wiki/Is-a)” Base instance, or in another words, a Derived instance can substitute a Base instance:
```
internal static partial class Variances
{
    internal static void Substitute()
    {
        Base @base = new Base();
        @base = new Derived();
    }
}
```

Here covariance and contravariance discusses the “is a” or substitution relationship of functions and generic interfaces. C# 2.0 introduces variances for functions, and C# 4.0 introduces variances for generic delegate types and generic interfaces. C# covariance/contravariance only applies to reference types, not value types. So the above Base and Derived types are defined as classes, and they are used to demonstrate the variances.

## Variances of non-generic function type

By using above Base and Derived as input and output type of function, there are 4 combinations:
```
// Derived -> Base
internal static Base DerivedToBase(Derived input) => new Base();

// Derived -> Derived
internal static Derived DerivedToDerived(Derived input) => new Derived();

// Base -> Base
internal static Base BaseToBase(Base input) => new Base();

// Base -> Derived
internal static Derived BaseToDerived(Base input) => new Derived();
```

They are of 4 different function types:
```
internal delegate Base DerivedToBase(Derived input); // Derived -> Base

internal delegate Derived DerivedToDerived(Derived input); // Derived -> Derived

internal delegate Base BaseToBase(Base input); // Base -> Base

internal delegate Derived BaseToDerived(Base input); // Base -> Derived
```

Take the second function DerivedToDerived as example, naturally, it is of the second function type DerivedToDerived:
```
internal static void NonGeneric()
{
    DerivedToDerived derivedToDerived = DerivedToDerived;
    Derived output = derivedToDerived(input: new Derived());
}
```

Since C# 2.0, it seems of the first function type DerivedToBase too:
```
internal static void NonGenericCovariance()
{
    DerivedToBase derivedToBase = DerivedToBase; // Derived -> Base

    // Covariance: Derived is Base, so that DerivedToDerived is DerivedToBase.
    derivedToBase = DerivedToDerived; // Derived -> Derived

    // When calling derivedToBase, DerivedToDerived executes.
    // derivedToBase should output Base, while DerivedToDerived outputs Derived.
    // The actual Derived output is the required Base output. This always works.
    Base output = derivedToBase(input: new Derived());
}
```

So function instance’s actual output can be more derived than function type’s required output. Therefore, function with more derived output “is a” function with less derived output, or in another word, function with more derived output can substitute function with less derived output. This is called covariance. Similarly, function instance’s input can be less derived than function type input:
```
internal static void NonGenericContravariance()
{
    DerivedToBase derivedToBase = DerivedToBase; // Derived -> Base

    // Contravariance: Derived is Base, so that BaseToBase is DerivedToBase.
    derivedToBase = BaseToBase; // Base -> Base

    // When calling derivedToBase, BaseToBase executes.
    // derivedToBase should accept Derived input, while BaseToBase accepts Base input.
    // The required Derived input is the accepted Base input. This always works.
    Base output = derivedToBase(input: new Derived());
}
```

Therefore, function with less derived input “is a” function with more derived input, or in another word, function with less derived input can substitute function with more derived input. This is called contravariance. Covariance and contravariance can happen at the same time:
```
internal static void NonGenericeCovarianceAndContravariance()
{
    DerivedToBase derivedToBase = DerivedToBase; // Derived -> Base

    // Covariance and contravariance: Derived is Base, so that BaseToDerived is DerivedToBase. 
    derivedToBase = BaseToDerived; // Base -> Derived

    // When calling derivedToBase, BaseToDerived executes.
    // derivedToBase should accept Derived input, while BaseToDerived accepts Base input.
    // The required Derived input is the accepted Base input.
    // derivedToBase should output Base, while BaseToDerived outputs Derived.
    // The actual Derived output is the required Base output. This always works.
    Base output = derivedToBase(input: new Derived());
}
```

Apparently, function instance output cannot be less derived than function type output, and function input cannot be more derived than function type input. The following code cannot be compiled:
```
internal static void NonGenericInvalidVariance()
{
    // baseToDerived should output Derived, while BaseToBase outputs Base. 
    // The actual Base output is not the required Derived output. This cannot be compiled.
    BaseToDerived baseToDerived = BaseToBase; // Base -> Derived

    // baseToDerived should accept Base input, while DerivedToDerived accepts Derived input.
    // The required Base input is not the accepted Derived input. This cannot be compiled.
    baseToDerived = DerivedToDerived; // Derived -> Derived

    // baseToDerived should accept Base input, while DerivedToBase accepts Derived input.
    // The required Base input is not the expected Derived input.
    // baseToDerived should output Derived, while DerivedToBase outputs Base.
    // The actual Base output is not the required Derived output. This cannot be compiled.
    baseToDerived = DerivedToBase; // Derived -> Base
}
```

## Variances of generic function type

With generic delegate type, all the above function types can be represented by:
```
internal delegate TOutput GenericFunc<TInput, TOutput>(TInput input);
```

Then the above variances can be represented as:
```
internal static void Generic()
{
    GenericFunc<Derived, Base> derivedToBase = DerivedToBase; // GenericFunc<Derived, Base>: no variances.
    derivedToBase = DerivedToDerived; // GenericFunc<Derived, Derived>: covariance.
    derivedToBase = BaseToBase; // GenericFunc<Base, Base>: contravariance.
    derivedToBase = BaseToDerived; // GenericFunc<Base, Derived>: covariance and contravariance.
}
```

For functions of GenericFunc<TInput, TOutput> type, covariance can happen when TOutput is substituted by more derived type, and contravariance can happen when TInput is substituted by less derived type. So TOutput is called covariant type parameter for this generic delegate type, and TInput is called contravariant type parameter. C# 4.0 introduces the out/in modifiers for the covariant/contravariant type parameter:
```
internal delegate TOutput GenericFuncWithVariances<in TInput, out TOutput>(TInput input);
```

These modifiers enable the implicit conversion/substitution between functions:
```
internal static void FunctionImplicitConversion()
{
    GenericFuncWithVariances<Derived, Base> derivedToBase = DerivedToBase; // Derived -> Base
    GenericFuncWithVariances<Derived, Derived> derivedToDerived = DerivedToDerived; // Derived -> Derived
    GenericFuncWithVariances<Base, Base> baseToBase = BaseToBase; // Base -> Base
    GenericFuncWithVariances<Base, Derived> baseToDerived = BaseToDerived; // Base -> Derived

    // Cannot be compiled without the out/in modifiers.
    derivedToBase = derivedToDerived; // Covariance.
    derivedToBase = baseToBase; // Contravariance.
    derivedToBase = baseToDerived; // Covariance and contravariance.
}
```

As fore mentioned, unified Func and Action generic delegate types are provided to represent all function types. Since .NET Framework 4.0, all their type parameters have the out/in modifiers:

```csharp
namespace System
{
    public delegate TResult Func<out TResult>();

    public delegate TResult Func<in T, out TResult>(T arg);

    public delegate TResult Func<in T1, in T2, out TResult>(T1 arg1, T2 arg2);

    // ...

    public delegate void Action();

    public delegate void Action<in T>(T obj);

    public delegate void Action<in T1, in T2>(T1 arg1, T2 arg2);

    // ...
}
```

Variant type parameter is not syntactic sugar. The out/in modifiers are compiled to CIL +/– flags in CIL:
```
.class public auto ansi sealed Func<-T, +TResult> extends System.MulticastDelegate
{
    .method public hidebysig newslot virtual instance !TResult Invoke(!T arg) runtime managed
    {
    }

    // Other members.
}
```

## Variances of generic interface

Besides generic delegate types, C# 4.0 also introduces variances for generic interfaces. An interface can be viewed as a set of function members’ signatures to indicate their function types, without implementations. For example:

```typescript
internal interface IOutput<out TOutput> // TOutput is covariant for all members using TOutput.
{
    TOutput ToOutput(); // () -> TOutput

    TOutput Output { get; } // get_Output: () -> TOutput

    void TypeParameterNotUsed();
}
```

In the above generic interface, there are 2 function members using the type parameter, and the type parameter is covariant for these 2 functions’ function types. Therefore, the type parameter is covariant for the interface, and the out modifier can be used to enable the implicit conversion:
```
internal static void GenericInterfaceCovariance(IOutput<Base> outputBase, IOutput<Derived> outputDerived)
{
    // Covariance: Derived is Base, so that IOutput<Derived> is IOutput<Base>.
    outputBase = outputDerived;

    // When calling outputBase.ToOutput, outputDerived.ToOutput executes.
    // outputBase.ToOutput should output Base, outputDerived.ToOutput outputs Derived.
    // The actual Derived output is the required Base output. This always works.
    Base output1 = outputBase.ToOutput();

    Base output2 = outputBase.Output; // outputBase.get_Output().
}
```

IOutput<Derived> interface does not inherit IOutput<Base> interface, but it seems a IOutput<Derived> interface “is an” IOutput<Base> interface, or in another word, IOutput<TOutput> interface with more derived type argument can substitute IOutput<TOutput> with less derived type argument. This is the covariance of generic interface. Similarly, generic interface can also have contravariant type parameter, and the in modifier can enable the implicit conversion:

```typescript
internal interface IInput<in TInput> // TInput is contravariant for all members using TInput.
{
    void InputToVoid(TInput input); // TInput -> void

    TInput Input { set; } // set_Input: TInput -> void

    void TypeParameterNotUsed();
}
```

IInput<Base> interface does not inherit IInput<Derived> interface, but it seems a IInput<Base> interface “is an” IInput<Derived> interface, or in another word, IInput<TInput> interface with more derived type argument can substitute IInput<TInput> with less derived type argument. This is the contravariance of generic interface:
```
internal static void GenericInterfaceContravariance(IInput<Derived> inputDerived, IInput<Base> inputBase)
{
    // Contravariance: Derived is Base, so that IInput<Base> is IInput<Derived>.
    inputDerived = inputBase;

    // When calling inputDerived.Input, inputBase.Input executes.
    // inputDerived.Input should accept Derived input, while inputBase.Input accepts Base input.
    // The required Derived output is the accepted Base input. This always works.
    inputDerived.InputToVoid(input: new Derived());

    inputDerived.Input = new Derived();
}
```

Similar to generic delegate type, generic interface can have covariant type parameter and contravariant type parameter at the same time:

```typescript
internal interface IInputOutput<in TInput, out TOutput> // TInput/TOutput is contravariant/covariant for all members using TInput/TOutput.
{
    void InputToVoid(TInput input); // TInput -> void

    TInput Input { set; } // set_Input: TInput -> void

    TOutput ToOutput(); // () -> TOutput

    TOutput Output { get; } // get_Output: () -> TOutput

    void TypeParameterNotUsed();
}
```

The following example demonstrates the covariance and contravariance:
```
internal static void GenericInterfaceCovarianceAndContravariance(
    IInputOutput<Derived, Base> inputDerivedOutputBase, IInputOutput<Base, Derived> inputBaseOutputDerived)
{
    // Covariance and contravariance: Derived is Base, so that IInputOutput<Base, Derived> is IInputOutput<Derived, Base>.
    inputDerivedOutputBase = inputBaseOutputDerived;

    inputDerivedOutputBase.InputToVoid(new Derived());
    inputDerivedOutputBase.Input = new Derived();
    Base output1 = inputDerivedOutputBase.ToOutput();
    Base output2 = inputDerivedOutputBase.Output;
}
```

Not all type parameters can be variant for generic interface. For example:

```typescript
internal interface IInvariant<T>
{
    T Output(); // T is covariant for Output: () -> T.

    void Input(T input); // T is contravariant for Input: T -> void.
}
```

The type parameter T is neither covariant for all function members using T, nor contravariant for all function members using T, so T cannot be covariant or contravariant for the interface.

## Variances of generic higher-order function

So far covariance and the out modifier are all about output, and contravariance and the in modifier are all about input. The variances are interesting for generic higher-order function types. For example, the following function type is higher-order, because it returns a function:
```
internal delegate Func<TOutput> ToFunc<out TOutput>(); // Covariant output type.
```

The type parameter is used by output function type, where it is still covariant. The following example demonstrate how this works:
```
internal static void OutputVariance()
{
    // First order functions.
    Func<Base> toBase = () => new Base();
    Func<Derived> toDerived = () => new Derived();

    // Higher-order functions.
    ToFunc<Base> toToBase = () => toBase;
    ToFunc<Derived> toToDerived = () => toDerived;

    // Covariance: Derived is Base, so that ToFunc<Derived> is ToFunc<Base>.
    toToBase = toToDerived;

    // When calling toToBase, toToDerived executes.
    // toToBase should output Func<Base>, while toToDerived outputs Func<Derived>.
    // The actual Func<Derived> output is the required Func<Base> output. This always works.
    Func<Base> output = toToBase();
}
```

For higher-order function types, when type parameter is used in output function type, it always covariant:
```
// () -> T:
internal delegate TOutput Func<out TOutput>(); // Covariant output type.

// () -> () -> T, equivalent to Func<Func<T>>:
internal delegate Func<TOutput> ToFunc<out TOutput>(); // Covariant output type.

// () -> () -> () -> T: Equivalent to Func<Func<Func<T>>>:
internal delegate ToFunc<TOutput> ToToFunc<out TOutput>(); // Covariant output type.

// () -> () -> () -> () -> T: Equivalent to Func<Func<Func<Func<T>>>>:
internal delegate ToToFunc<TOutput> ToToToFunc<out TOutput>(); // Covariant output type.

// ...
```

Similarly, higher-order function type can be defined by accepting function as input:
```
internal delegate void ActionToVoid<in TTInput>(Action<TTInput> action); // Cannot be compiled.

internal static void InputVariance()
{
    ActionToVoid<Derived> derivedToVoidToVoid = (Action<Derived> derivedToVoid) => { };
    ActionToVoid<Base> baseToVoidToVoid = (Action<Base> baseToVoid) => { };
    derivedToVoidToVoid = baseToVoidToVoid;
}
```

However, the above code cannot be compiled. The reason is, when type parameter is used by input function type, it can be covariant or contravariant. In this case, it becomes contravariant:
```
internal delegate void ActionToVoid<out TInput>(Action<TInput> action);
```

And this is how it works:
```
internal static void InputVariance()
{
    // Higher-order functions.
    ActionToVoid<Derived> derivedToVoidToVoid = (Action<Derived> derivedToVoid) => { };
    ActionToVoid<Base> baseToVoidToVoid = (Action<Base> baseToVoid) => { };

    // Covariance: Derived is Base, so that ActionToVoid<Derived> is ActionToVoid<Base>.
    baseToVoidToVoid = derivedToVoidToVoid;

    // When calling baseToVoidToVoid, derivedToVoidToVoid executes.
    // baseToVoidToVoid should accept Action<Base> input, while derivedToVoidToVoid accepts Action<Derived> input.
    // The required Action<Derived> input is the accepted Action<Base> input. This always works.
    baseToVoidToVoid(default(Action<Base>));
}
```

For higher-order function types, when type parameter is used in input function type, here are its variances:
```
// () -> void:
internal delegate void Action<in TInput>(TInput input); // Contravariant input type.

// (() -> void) -> void, equivalent to Action<Action<T>>:
internal delegate void ActionToVoid<out TTInput>(Action<TTInput> action); // Covariant input type.

// ((() -> void) -> void) -> void, equivalent to Action<Action<Action<T>>>:
internal delegate void ActionToVoidToVoid<in TTInput>(ActionToVoid<TTInput> actionToVoid); // Contravariant input type.

// (((() -> void) -> void) -> void) -> void, equivalent to Action<Action<Action<Action<T>>>>:
internal delegate void ActionToVoidToVoidToVoid<out TTInput>(ActionToVoidToVoid<TTInput> actionToVoidToVoid); // Covariant input type.

// ...
```

## Covariance of array

As fore mentioned, an array T\[\] implements IList<T>:

```csharp
namespace System.Collections.Generic
{
    public interface IList<T> : ICollection<T>, IEnumerable<T>, IEnumerable
    {
        T this[int index] { get; set; }
        // T is covariant for get_Item: int -> T.
        // T is contravariant for set_Item: (int, T) -> void.

        // Other members.
    }
}
```

For IList<T>, T is not covariant for its indexer setter, and T is not contravariant for its indexer getter. So T should be invariant for IList<T> and array T\[\]. However, C# compiler and CLR/CoreCLR unexpectedly supports covariance for array. The following example can be compiled but throws ArrayTypeMismatchException at runtime, which can be a source of bugs:
```
internal static void ArrayCovariance()
{
    Base[] baseArray = new Base[3];
    Derived[] derivedArray = new Derived[3];

    baseArray = derivedArray; // Array covariance at compile time, baseArray refers to a Derived array at runtime.
    Base value = baseArray[0];
    baseArray[1] = new Derived();
    baseArray[2] = new Base(); // ArrayTypeMismatchException at runtime, Base cannot be in Derived array.
}
```

Here are some background information for array covariance:

-   [Jonathan Allen said](http://www.infoq.com/news/2008/08/GenericVariance),
    
    > On a historical note, C# and VB both support array covariance ([out/IEnumerable scenario](http://www.cnblogs.com/dixin/archive/2009/09/01/understanding-csharp-covariance-and-contravariance-6-typing-issues.html)) even though it can lead to runtime errors in contravariant situations (in/IWriter scenario). This was done in order to make C# more compatible with Java. This is generally considered a poor decision, but it cannot be undone at this time.
    
-   In the book “[The Common Language Infrastructure Annotated Standard](http://www.amazon.com/exec/obidos/tg/detail/-/0321154932)”, Jim Miller said,
    
    > The decision to support covariant arrays was primarily to allow Java to run on the VES. The covariant design is not thought to be the best design in general, but it was chosen in the interest of broad reach.
    
-   [Rick Byers said](http://blogs.msdn.com/rmbyers/archive/2005/02/16/375079.aspx),
    
    > I've heard that Bill Joy, one of the original Java designers, has since said that he tried to remove array covariance in 1995 but wasn't able to do it in time, and has regretted having it in Java ever since.
    
-   Anders Hejlsberg ([chief architect](http://en.wikipedia.org/wiki/Anders_Hejlsberg) of C#) [said in this video](http://channel9.msdn.com/shows/Going+Deep/Expert-to-Expert-Anders-Hejlsberg-The-Future-of-C/),
    
    > This isn't type safe. A lot of people maybe don't even realize that there's a hole there.
    
-   [Eric Lippert](http://ericlippert.com/) (member of C# design team) [put array covariance the top 1 of 10 worst C# features](http://www.informit.com/articles/article.aspx?p=2425867)
    
    > C# 1.0 has unsafe array covariance not because the designers of C# thought that the scenario was particularly compelling, but rather because the Common Language Runtime (CLR) has the feature in its type system, so C# gets it "for free." The CLR has it because Java has this feature; the CLR team wanted to design a runtime that could implement Java efficiently, should that become necessary.
    

This is a C# language feature that should never be used.

## Variances in .NET and LINQ

The following LINQ query finds the generic delegate types and interfaces with variant type parameters in .NET core library:
```
internal static void TypesWithVariance()
{
    Assembly coreLibrary = typeof(object).Assembly;
    coreLibrary.GetExportedTypes()
        .Where(type => type.GetGenericArguments().Any(typeArgument =>
        {
            GenericParameterAttributes attributes = typeArgument.GenericParameterAttributes;
            return attributes.HasFlag(GenericParameterAttributes.Covariant)
                || attributes.HasFlag(GenericParameterAttributes.Contravariant);
        }))
        .OrderBy(type => type.FullName)
        .WriteLines();
        // System.Action`1[T]
        // System.Action`2[T1,T2]
        // System.Action`3[T1,T2,T3]
        // System.Action`4[T1,T2,T3,T4]
        // System.Action`5[T1,T2,T3,T4,T5]
        // System.Action`6[T1,T2,T3,T4,T5,T6]
        // System.Action`7[T1,T2,T3,T4,T5,T6,T7]
        // System.Action`8[T1,T2,T3,T4,T5,T6,T7,T8]
        // System.Collections.Generic.IComparer`1[T]
        // System.Collections.Generic.IEnumerable`1[T]
        // System.Collections.Generic.IEnumerator`1[T]
        // System.Collections.Generic.IEqualityComparer`1[T]
        // System.Collections.Generic.IReadOnlyCollection`1[T]
        // System.Collections.Generic.IReadOnlyList`1[T]
        // System.Comparison`1[T]
        // System.Converter`2[TInput,TOutput]
        // System.Func`1[TResult]
        // System.Func`2[T,TResult]
        // System.Func`3[T1,T2,TResult]
        // System.Func`4[T1,T2,T3,TResult]
        // System.Func`5[T1,T2,T3,T4,TResult]
        // System.Func`6[T1,T2,T3,T4,T5,TResult]
        // System.Func`7[T1,T2,T3,T4,T5,T6,TResult]
        // System.Func`8[T1,T2,T3,T4,T5,T6,T7,TResult]
        // System.Func`9[T1,T2,T3,T4,T5,T6,T7,T8,TResult]
        // System.IComparable`1[T]
        // System.IObservable`1[T]
        // System.IObserver`1[T]
        // System.IProgress`1[T]
        // System.Predicate`1[T]
}
```

Under System.Linq namespace, there are also a number of generic interfaces with variance: IGrouping<out TKey, out TElement>, IQueryable<out T>, IOrderedQueryable<out T>. MSDN has a [List of Variant Generic Interface and Delegate Types](https://msdn.microsoft.com/en-us/library/dd799517#VariantList), but it is inaccurate. For example, it says TElement is covariant for IOrderedEnumerable<TElement>, but actually not:

```csharp
namespace System.Linq
{
    public interface IOrderedEnumerable<TElement> : IEnumerable<TElement>, IEnumerable
    {
        IOrderedEnumerable<TElement> CreateOrderedEnumerable<TKey>(Func<TElement, TKey> keySelector, IComparer<TKey> comparer, bool descending);
    }
}
```

For local sequential LINQ, as fore mentioned, T is covariant for IEnumerable<T>. Here is the full story:

```csharp
namespace System.Collections.Generic
{
    /// <summary>Exposes the enumerator, which supports a simple iteration over a collection of a specified type.</summary>
    /// <typeparam name="T">The type of objects to enumerate.This type parameter is covariant. That is, you can use either the type you specified or any type that is more derived. For more information about covariance and contravariance, see Covariance and Contravariance in Generics.</typeparam>
    public interface IEnumerator<out T> : IDisposable, IEnumerator
    {
        T Current { get; } // T is covariant for get_Current: () –> T.
    }

    /// <summary>Exposes the enumerator, which supports a simple iteration over a collection of a specified type.</summary>
    /// <typeparam name="T">The type of objects to enumerate.This type parameter is covariant. That is, you can use either the type you specified or any type that is more derived. For more information about covariance and contravariance, see Covariance and Contravariance in Generics.</typeparam>
    public interface IEnumerable<out T> : IEnumerable
    {
        IEnumerator<T> GetEnumerator(); // T is covariant for IEnumerator<T>, so T is covariant for () -> IEnumerator<T>.
    }
}
```

First, IEnumerator<T>’s type parameter is only used by its Current property’s getter, which can be viewed as a get\_Current function of type () –> T, and IEnumerator<T> can be viewed as a wrapper of () –> T function. Since T is covariance for () –> T function, T is also covariant for IEnumerator<T> wrapper. Then, in IEnumerable<T>, T is only used by GetEnumerator method returning IEnumerator<T>. Regarding IEnumerator<T> is a simple wrapper of () –> T function, GetEnumerator can be virtually viewed as a higher-order function returning () –> T function, Therefore, GetEnumerator’s function type () –> IEnumerator<T> can be virtually viewed as higher-order function type () –> () –> T. And similarly, IEnumerable<T> can be viewed as a wrapper of this () –> () –> T function. Since T is still covariant for () –> () –> T, T is also covariance for IEnumerable<T> wrapper. This brings convenience to LINQ queries. For example, the following LINQ query method concatenates 2 IEnumerable<T> instances:

```csharp
namespace System.Linq
{
    public static class Enumerable
    {
        public static IEnumerable<TSource> Concat<TSource>(this IEnumerable<TSource> first, IEnumerable<TSource> second);
    }
}
```

The following code demonstrates the implicit conversion enabled by the out modifier in the IEnumerable<T> definition:
```
internal static void LinqToObjects(IEnumerable<Base> enumerableOfBase, IEnumerable<Derived> enumerableOfDerived)
{
    enumerableOfBase = enumerableOfBase.Concat(enumerableOfDerived);
}
```

For local Parallel LINQ, ParallelQuery<T> is a class instead of interface, so there T is not variant. Again, variance of type parameter is for function type, including non-generic delegate type, generic delegate type and generic interface. Class can have function implementation so variances do not apply.

For remote LINQ, here is the definition of IQueryable<T>:

```csharp
namespace System.Linq
{
    /// <summary>Provides functionality to evaluate queries against a specific data source wherein the type of the data is known.</summary>
    /// <typeparam name="T">The type of objects to enumerate.This type parameter is covariant. That is, you can use either the type you specified or any type that is more derived. For more information about covariance and contravariance, see Covariance and Contravariance in Generics.</typeparam>
    public interface IQueryable<out T> : IEnumerable<T>, IEnumerable, IQueryable { }
}
```

Here T is only used for the member inherited from IEnumerable<T>, so apparently, T remains covariant for IQueryable<T>.