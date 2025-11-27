---
title: "C# Functional Programming In-Depth (11) Covariance and Contravariance"
published: 2019-06-11
description: "In programming languages with subtyping support, variance is the ability to substitute a type with a different subtype or supertype in a context. For example, having a subtype and a supertype, can a f"
image: ""
tags: [".NET", "C#", "C# 2.0", "C# 3.0", "LINQ", "LINQ via C#", "C# Features", "Functional Programming", "Functional C#"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

In programming languages with subtyping support, variance is the ability to substitute a type with a different subtype or supertype in a context. For example, having a subtype and a supertype, can a function of subtype output substitute a function of supertype output? Can a sequence of subtype substitute a sequence of supertype? C# supports covariance/contravariance, which means to use a more/less specific type to substitute the required type in the context of function and interface.

## Subtyping and type polymorphism

The following is a simple example of subtyping:

internal interface ISupertype { /\* Members. \*/ }

internal interface ISubtype : ISupertype { /\* More members. \*/ }

Here ISubtype interface implements ISupertype interface. In this relationship, ISubtype is more specific supertype, and ISupertype is less specific supertype, which can be denoted ISubtype <: ISupertype. A subtype instance can substitute a supertype instance. In another word, an instance’s type can be more specific than required type:

internal static void Substitute(ISupertype supertype, ISubtype subtype)
```
{
```
```
supertype = subtype;
```

}

In object-oriented programming, subtyping is intuitive with inheritance:

internal class Base { }

internal class Derived : Base { }

Similarly, Derived is a more derived and more specific subtype, and Base is a less derived and less specific supertype. Apparently Derived <: Base (called a Derived instance “is a” Base instance in object-oriented programming), and Derived instance can substitute Base instance (called Liskov substitution principle in object-oriented programming):

internal static void Substitute()
```
{
```
```
Base @base = new Base();
```
```
@base = new Derived();
```

}

C#’s covariance and contravariance enables the subtyping and substitution relationship for functions and generic interfaces. Subtyping does not have to be inheritance, but to be intuitive to most C# developers, this chapter uses above Base and Derived types to demonstrate variances in all contexts. As discussed in the C# basics chapter, in C#, value types consist of structures and enumerations. All structures inherit System.ValueType class, and all enumerations inherit System.Enum class, so one value type cannot be subtype of another value type. As a result, C#’s covariance and contravariance only applies to reference types, so the above Base and Derived types are defined as classes.

## Variances of non-generic function type

When using above Base and Derived as input and output type of function, there are 4 cases:

// Derived -> Base
```
internal static Base DerivedToBase(Derived input) => new Base();
```
```
// Derived -> Derived
```
```
internal static Derived DerivedToDerived(Derived input) => new Derived();
```
```
// Base -> Base
```
```
internal static Base BaseToBase(Base input) => new Base();
```
```
// Base -> Derived
```

internal static Derived BaseToDerived(Base input) => new Derived();

Their function types can be represented by the following non-generic delegate types:

// Derived -> Base
```
internal delegate Base DerivedToBase(Derived input);
```
```
// Derived -> Derived
```
```
internal delegate Derived DerivedToDerived(Derived input);
```
```
// Base -> Base
```
```
internal delegate Base BaseToBase(Base input);
```
```
// Base -> Derived
```

internal delegate Derived BaseToDerived(Base input);

Take the first function DerivedToBase as example, it is of type Derived -> Base, represented by the first delegate type DerivedToBase:

internal static void NonGenericDelegate()
```
{
```
```
DerivedToDerived derivedToDerived = DerivedToDerived;
```
```
Derived output = derivedToDerived(input: new Derived());
```

}

The second function DerivedToDerived is not of type Derived -> Base, but Derived -> Derived, represented by the second delegate type. Since C# 2.0, DerivedToBase can be substituted by DerivedToDerived in context of non-generic delegate:

internal static void NonGenericDelegateCovariance()
```
{
```
```
DerivedToBase derivedToBase = DerivedToBase; // Derived -> Base
```
```
// Covariance: Derived <: Base, so that Derived -> Derived <: Derived -> Base.
```
```
derivedToBase = DerivedToDerived; // Derived -> Derived
```
```
// When calling derivedToBase, DerivedToDerived executes.
```
```
// derivedToBase should output Base, while DerivedToDerived outputs Derived.
```
```
// The actual Derived output substitutes the required Base output. This call always works.
```
```
Base output = derivedToBase(input: new Derived());
```

}

So, function with more derived/specific output can substitute function with less derived/specific output, as if former function type is subtype and latter function type is supertype. In another word, function instance’s actual output can be more derived/specific than function type’s required output. This is called covariance, because it persists the direction of subtyping/substitution: if Derived <: Based then function with Derived output <: function with Base output. Similarly, function instance’s input can be less derived/specific than function type input:

internal static void NonGenericDelegateContravariance()
```
{
```
```
DerivedToBase derivedToBase = DerivedToBase; // Derived -> Base
```
```
// Contravariance: Derived <: Base, so that Base -> Base <: Derived ->Base.
```
```
derivedToBase = BaseToBase; // Base -> Base
```
```
// When calling derivedToBase, BaseToBase executes.
```
```
// derivedToBase should accept Derived input, while BaseToBase accepts Base input.
```
```
// The required Derived input substitutes the accepted Base input. This always works.
```
```
Base output = derivedToBase(input: new Derived());
```

}

So, function with less derived/specific input can substitute function with more derived input, or in another word, function instance’s output can be less derived/specific than function type’s required input. This is called contravariance, because it inverts the direction of subtyping/substitution: if Derived <: Base then function with Base input< : function with Derived inp_ut._ Covariance (for output) and contravariance (for input) can work at the same time:

internal static void NonGenericDelegateCovarianceAndContravariance()
```
{
```
```
DerivedToBase derivedToBase = DerivedToBase; // Derived -> Base
```
```
// Covariance and contravariance: Derived <: Base, so that Base -> Derived <: Derived -> Base.
```
```
derivedToBase = BaseToDerived; // Base -> Derived
```
```
// When calling derivedToBase, BaseToDerived executes.
```
```
// derivedToBase should accept Derived input, while BaseToDerived accepts Base input.
```
```
// The required Derived input substitutes the accepted Base input.
```
```
// derivedToBase should output Base, while BaseToDerived outputs Derived.
```
```
// The actual Derived output substitutes the required Base output. This always works.
```
```
Base output = derivedToBase(input: new Derived());
```

}

On the other hand, function output cannot be less derived/specific than required, and function input cannot be more derived/specific than required. The following function substitution cannot be compiled:

internal static void NonGenericDelegateInvariance()
```
{
```
```
// baseToDerived should output Derived, while BaseToBase outputs Base.
```
```
// The actual Base output does not substitute the required Derived output. This cannot be compiled.
```
```
BaseToDerived baseToDerived = BaseToBase; // Base -> Derived
```
```
// baseToDerived should accept Base input, while DerivedToDerived accepts Derived input.
```
```
// The required Base input does not substitute the accepted Derived input. This cannot be compiled.
```
```
baseToDerived = DerivedToDerived; // Derived -> Derived
```
```
// baseToDerived should accept Base input, while DerivedToBase accepts Derived input.
```
```
// The required Base input does not substitute the expected Derived input.
```
```
// baseToDerived should output Derived, while DerivedToBase outputs Base.
```
```
// The actual Base output does not substitute the required Derived output. This cannot be compiled.
```
```
baseToDerived = DerivedToBase; // Derived -> Base
```

}

## Variances of generic function type

With generic delegate type, all the above function types can be represented by:

internal delegate TOutput GenericFunc<TInput, TOutput\>(TInput input);

Then the delegate instance can be initialized with variances:

internal static void GenericDelegateCovarianceAndContravariance()
```
{
```
```
GenericFunc<Derived, Base> derivedToBase = DerivedToBase; // No variance.
```
```
derivedToBase = DerivedToDerived; // Covariance.
```
```
derivedToBase = BaseToBase; // Contravariance.
```
```
derivedToBase = BaseToDerived; // Covariance and contravariance.
```

}

For functions of GenericFunc<TInput, TOutput> type, covariance enables TOutput to be substituted by more specific type, and contravariance enables TInput to be substituted by less derived type. So TOutput/TInput are called covariant/contravariant type parameter for this generic delegate type. C# 4.0 introduces the out/in modifiers for the covariant/contravariant type parameter:

internal delegate TOutput GenericFuncWithVariances<in TInput, out TOutput\>(TInput input);

These modifiers enable further variances, the substitution of generic delegate instances:

internal static void GenericDelegateInstanceSubstitution()
```
{
```
```
GenericFuncWithVariances<Derived, Base>derivedToBase = DerivedToBase; // Derived -> Base
```
```
GenericFuncWithVariances<Derived, Derived>derivedToDerived = DerivedToDerived; // Derived ->Derived
```
```
GenericFuncWithVariances<Base, Base>baseToBase = BaseToBase; // Base -> Base
```
```
GenericFuncWithVariances<Base, Derived>baseToDerived = BaseToDerived; // Base -> Derived
```
```
// Cannot be compiled without the out/in modifiers.
```
```
derivedToBase = derivedToDerived; // Covariance.
```
```
derivedToBase = baseToBase; // Contravariance.
```
```
derivedToBase = baseToDerived; // Covariance and contravariance.
```

}

As discussed, TInput cannot be covariant, and TOutput cannot be contravariant, in the following definition, TInput with out modifier or TOutput with in modifier cannot work:

// Cannot be compiled.

internal delegate TOutput GenericFuncWithVariances<out TInput, in TOutput>(TInput input);

As mentioned in the delegate chapter, unified Func and Action generic delegate types are provided to represent all function types. Since .NET Framework 4.0, all their type parameters have the out/in modifiers:

namespace System
```
{
```
```
public delegate TResult Func<out TResult>();
```
```
public delegate TResult Func<in T, out TResult>(T arg);
```
```
public delegate TResult Func<in T1, in T2, out TResult>(T1 arg1, T2 arg2);
```
```
// ...
```
```
public delegate void Action();
```
```
public delegate void Action<in T>(T obj);
```
```
public delegate void Action<in T1, in T2>(T1 arg1, T2 arg2);
```
```
// ...
```

}

Variant type parameter is not syntactic sugar, but a runtime feature. The out/in modifiers are compiled to the +/- flags in CIL, which can be read as can be more/less specific:

.class public auto ansi sealed Func<-T, +TResult\> extends System.MulticastDelegate
```
{
```

}

## Variances of generic interface

Besides generic function types, C# 4.0 also supports variances for generic interfaces. An interface can be viewed as a group of function types of named function members. For example:

internal interface IOutput<out TOutput\> // TOutput is covariant for all members using TOutput.
```
{
```
```
TOutput ToOutput(); // TOutput is covariant.
```
```
TOutput Output { get; } // Compiled to get_Output. TOutput is covariant.
```
```
void TypeParameterNotUsed();
```

}

The above generic interface definition has 3 function members, where 2 function members uses the type parameter only as output type. Apparently, the type parameter is covariant for both 2 functions’ function types. In this case, the type parameter is covariant for the interface level, and the out modifier can be used to enable the substitution of interface instances:

internal static void GenericInterfaceCovariance(
```
IOutput<Base> outputBase, IOutput<Derived> outputDerived)
```
```
{
```
```
// Covariance: Derived <: Base, so that IOutput<Derived> <: IOutput<Base>.
```
```
outputBase = outputDerived;
```
```
// When calling outputBase.ToOutput, outputDerived.ToOutput executes.
```
```
// outputBase.ToOutput should output Base, outputDerived.ToOutput outputs Derived.
```
```
// The actual Derived output substitutes the required Base output. This always works.
```
```
Base output1 = outputBase.ToOutput();
```
```
Base output2 = outputBase.Output; // .get_Output();
```

}

IOutput<Derived> interface does not implement IOutput<Base> interface, but with out modifier, IOutput<Derived> instance can still substitute IOutput<Base> instance, as if IOutput<Derived> is subtype and IOutput<Base> is supertype.

Similarly, generic interface can also have contravariant type parameter, with in modifier:

internal interface IInput<in TInput\> // TInput is contravariant for all members using TInput.
```
{
```
```
void InputToVoid(TInput input); // TInput is contravariant.
```
```
TInput Input { set; } // Compiled to set_Input. TInput is contravariant.
```
```
void TypeParameterNotUsed();
```

}

The above generic interface definition has 3 function members, where 2 function members uses the type parameter only as input type. Apparently, the type parameter is contravariant for both 2 functions’ function types. In this case, the type parameter is contravariant for the interface level, and the in modifier can be used to enable the substitution of interface instances:

internal static void GenericInterfaceContravariance(
```
IInput<Derived> inputDerived, IInput<Base> inputBase)
```
```
{
```
```
// Contravariance: Derived <: Base, so that IInput<Base> <: IInput<Derived>.
```
```
inputDerived = inputBase;
```
```
// When calling inputDerived.Input, inputBase.Input executes.
```
```
// inputDerived.Input should accept Derived input, while inputBase.Input accepts Base input.
```
```
// The required Derived output substitutes the accepted Base input. This always works.
```
```
inputDerived.InputToVoid(input: new Derived());
```
```
inputDerived.Input = new Derived(); // .set_Input(input: new Derived());
```

}

IInput<Base> interface does not implement IInput<Derived> interface, but with in modifier, IInput<Base> instance can still substitute IInput<Derived> instance, as if IInput<Base> is subtype and IInput<Derived> is supertype.

Similar to generic delegate type, generic interface can have covariant type parameter and contravariant type parameter at the same time:

internal interface IInputOutput<in TInput, out TOutput\> // TInput is contravariant for all members using TInput, TOutput is covariant for all members usingTOutput.
```
{
```
```
void InputToVoid(TInput input); // TInput is contravariant.
```
```
TInput Input { set; } // Compiled to set_Input. TInput is contravariant.
```
```
TOutput ToOutput(); // TOutput is covariant.
```
```
TOutput Output { get; } // Compiled to get_Output. TOutput is covariant.
```
```
void TypeParameterNotUsed();
```

}

The following example demonstrates the covariance and contravariance:

internal static void GenericInterfaceCovarianceAndContravariance(
```
IInputOutput<Derived, Base>inputDerivedOutputBase,
```
```
IInputOutput<Base, Derived> inputBaseOutputDerived)
```
```
{
```
```
// Covariance and contravariance: Derived <: Base, so that IInputOutput<Base, Derived> <: IInputOutput<Derived, Base>.
```
```
inputDerivedOutputBase = inputBaseOutputDerived;
```
```
inputDerivedOutputBase.InputToVoid(new Derived());
```
```
inputDerivedOutputBase.Input = new Derived(); // .set_Input(input: new Derived());
```
```
Base output1 = inputDerivedOutputBase.ToOutput();
```
```
Base output2 = inputDerivedOutputBase.Output; // .get_Output();
```

}

Not all type parameters can be variant for generic interface. For example:

internal interface IInvariant<T\>
```
{
```
```
T Output(); // T is covariant.
```
```
void Input(T input); // T is contravariant.
```

}

The type parameter T is neither covariant for all function members using T, nor contravariant for all function members using T, so T cannot be covariant or contravariant for the interface level.

## Variances of generic higher-order function type

The variances are interesting for generic higher-order function types. Higher-order function type can be defined by outputting function, since it outputs a function. Regarding the type parameter is only used as output, use the out modifier:

// () -> () -> TOutput Equivalent to Func<Func<TOutput>>

internal delegate Func<TOutput\> ToFunc<out TOutput\>(); // Covariant output type.

Marking the type parameter as covariant, the code can still be compiled. The following example demonstrates how the variance and substitution work at runtime:

internal static void OutputCovariance()
```
{
```
```
// First order functions.
```
```
Func<Base>toBase = () => new Base(); // () -> Base
```
```
Func<Derived> toDerived = () => new Derived(); // () -> Derived
```
```
// Higher-order functions.
```
```
ToFunc<Base>toToBase = () => toBase; // () -> () -> Base
```
```
ToFunc<Derived> toToDerived = () => toDerived; // () -> () -> Derived
```
```
// Covariance: Derived <: Base, so that () -> () -> Derived <: () -> () -> Base.
```
```
toToBase = toToDerived;
```
```
// When calling toToBase, toToDerived executes.
```
```
// toToBase should output Func<Base>, while toToDerived outputs Func<Derived>.
```
```
// The actual Func<Derived> output substitutes the required Func<Base> output. This always works.
```
```
Func<Base>output = toToBase();
```

}

The reason is, covariance persists the direction of subtyping and substitution, Derived <: Base in Context<out T> leads to Context<Derived> <: Context<Base>, Context<Context<Derived>> <: Context<Context<Base>>, Context<Context<Context<Derived>>> <: Context<Context<Context<Derived>>>, and so on. T is always covariant for Context<Context<T>>, Context<Context<Context<T>>>, etc. Take above Func<out TResult> as example:

// () -> TOutput
```
internal delegate TOutput Func<out TOutput>(); // Covariant.
```
```
// () -> () -> TOutput: Equivalent to Func<Func<TOutput>>.
```
```
internal delegate Func<TOutput> ToFunc<out TOutput>(); // Covariant.
```
```
// () -> () -> () -> TOutput: Equivalent to Func<Func<Func<TOutput>>>.
```
```
internal delegate ToFunc<TOutput> ToToFunc<out TOutput>(); // Covariant.
```
```
// () -> () -> () -> () -> TOutput: Equivalent to Func<Func<Func<Func<TOutput>>>>.
```
```
internal delegate ToToFunc<TOutput> ToToToFunc<out TOutput>(); // Covariant.
```

// ...

Higher-order function type can also be defined by accepting function as input. Regarding the type parameter is only used as input, use the in modifier:

// (TInput -> void) -> void: Equivalent to Action<Action<TInput>>.

internal delegate void ActionToVoid<in TTInput\>(Action<TTInput\> action); // Cannot be compiled.

However, the above code cannot be compiled. Marking the type parameter as covariant works:

// (TInput -> void) -> void: Equivalent to Action<Action<TInput>>.

internal delegate void ActionToVoid<out TInput\>(Action<TInput\> action);

And this is how the variance and substitution works at runtime:

internal static void InputCovarianceAndContravariance()
```
{
```
```
// Higher-order functions.
```
```
ActionToVoid<Derived> derivedToVoidToVoid = (Action<Derived> derivedToVoid) => { };
```
```
ActionToVoid<Base> baseToVoidToVoid = (Action<Base>baseToVoid) => { };
```
```
// Covariance: Derived <: Base, so that(Derived -> void) -> void <: (Base -> void) -> void.
```
```
baseToVoidToVoid = derivedToVoidToVoid;
```
```
// When calling baseToVoidToVoid, derivedToVoidToVoid executes.
```
```
// baseToVoidToVoid should accept Action<Base> input, while derivedToVoidToVoid accepts Action<Derived> input.
```
```
// The required Action<Derived> input substitutes the accepted Action<Base> input. This always works.
```
```
baseToVoidToVoid(default(Action<Base>));
```

}

The reason is, contravariance inverts the direction of subtyping and substitution, Derived <: Base in Context<in T> leads to Context<Base> <: Context<Derived>, Context<Context<Derived>> <: Context<Context<Base>>, Context<Context<Context<Base>>> <: Context<Context<Context<Derived>>>, and so on. T becomes covariant for Context<Context<T>>, contravariant for Context< Context<Context<T>>>, covariant for Context<Context<Context<Context<T>>>>, etc. Take above Action<in T> as example:

// TInput -> void
```
internal delegate void Action<in TInput>(TInput input); // Contravariant.
```
```
// (TInput -> void) -> void: Equivalent to Action<Action<TInput>>.
```
```
internal delegate void ActionToVoid<out TTInput>(Action<TTInput> action); // Covariant.
```
```
// ((TInput -> void) -> void) -> void: Equivalent to Action<Action<Action<TInput>>>.
```
```
internal delegate void ActionToVoidToVoid<in TTInput>(ActionToVoid<TTInput> actionToVoid); // Contravariant.
```
```
// (((TInput -> void) -> void) -> void) -> void: Equivalent to Action<Action<Action<Action<TInput>>>>.
```
```
internal delegate void ActionToVoidToVoidToVoid<out TTInput>(ActionToVoidToVoid<TTInput> actionToVoidToVoid); // Covariant.
```

// ...

## Covariance of array

Array T\[\] implements IList<T> interface:

namespace System.Collections.Generic
```
{
```
```
public interface IList<T>: ICollection<T>, IEnumerable<T>, IEnumerable
```
```
{
```
```
T this[int index] { get; set; }
```
```
// Indexer getter is compiled to get_Item. T is covariant.
```
```
// Indexer setter is compiled to set_Item. T is contravariant.
```
```
// Other members.
```
```
}
```

}

For IList<T>, T is used by indexer getter and setter function members. T is the output type of the compiled get\_Item function, and is the input type of the compiled set\_Item function. Apparently, T is neither covariant for both functions’ types, and nor contravariant for both functions’ types. So, T should be invariant for IList<T> and array T\[\]. However, C# compiler and .NET runtime unexpectedly support covariance for array. The following example can be compiled, but throws ArrayTypeMismatchException at runtime, which can be a source of bugs:

internal static void ArrayCovariance()
```
{
```
```
Base[] baseArray = new Base[3];
```
```
Derived[] derivedArray = new Derived[3];
```
```
baseArray = derivedArray; // Array covariance: Derived <: Base, so that Derived[]< : Base[], baseArray refers to a Derived array at runtime.
```
```
baseArray[1] = new Derived(); // .set_Item(new Derived());
```
```
baseArray[2] = new Base(); // .set_Item(new Base());
```
```
// ArrayTypeMismatchException at runtime. The actual Derived array requires Derived instance, the provided Base instance cannot substitute Derived instance.
```

}

Array covariance is first introduced to Java by its designers. They intended to remove this feature from Java around 1995, but they were unable to make it. Later, when .NET Framework is initially released, array covariance is implemented by CLR and C# as a Java feature for the convenience of Java developers. This is a C# language feature that should not be used.

## Variances in .NET and LINQ

The following LINQ query finds the generic delegate types and interfaces with variant type parameters in .NET core library:

internal static void TypesWithVariance()
```
{
```
```
Assembly coreLibrary = typeof(object).Assembly;
```
```
coreLibrary.ExportedTypes
```
```
.Where(type => type.GetGenericArguments().Any(typeArgument =>
```
```
{
```
```
GenericParameterAttributes attributes = typeArgument.GenericParameterAttributes;
```
```
return attributes.HasFlag(GenericParameterAttributes.Covariant)
```
```
|| attributes.HasFlag(GenericParameterAttributes.Contravariant);
```
```
}))
```
```
.OrderBy(type => type.FullName)
```
```
.WriteLines();
```
```
// System.Action`1[T]
```
```
// System.Action`2[T1,T2]
```
```
// …
```
```
// System.Action`8[T1,T2,T3,T4,T5,T6,T7,T8]
```
```
// System.Collections.Generic.IComparer`1[T]
```
```
// System.Collections.Generic.IEnumerable`1[T]
```
```
// System.Collections.Generic.IEnumerator`1[T]
```
```
// System.Collections.Generic.IEqualityComparer`1[T]
```
```
// System.Collections.Generic.IReadOnlyCollection`1[T]
```
```
// System.Collections.Generic.IReadOnlyList`1[T]
```
```
// System.Comparison`1[T]
```
```
// System.Converter`2[TInput,TOutput]
```
```
// System.Func`1[TResult]
```
```
// System.Func`2[T,TResult]
```
```
// …
```
```
// System.Func`9[T1,T2,T3,T4,T5,T6,T7,T8,TResult]
```
```
// System.IComparable`1[T]
```
```
// System.IObservable`1[T]
```
```
// System.IObserver`1[T]
```
```
// System.IProgress`1[T]
```
```
// System.Predicate`1[T]
```

}

Under System.Linq namespace, there are also a number of generic interfaces with variance: IGrouping<out TKey, out TElement>, IQueryable<out T>, IOrderedQueryable<out T>. Microsoft has documented the List of Variant Generic Interface and Delegate Types: https://docs.microsoft.com/en-us/dotnet/standard/generics/covariance-and-contravariance#VariantList, but it is inaccurate. It says TElement is covariant for IOrderedEnumerable<TElement>, but actually not:

namespace System.Linq
```
{
```
```
public interface IOrderedEnumerable<TElement> : IEnumerable<TElement>, IEnumerable
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

}

Local LINQ query is represented by IEnumerable<T> generic interface, where T is covariant:

namespace System.Collections.Generic
```
{
```
```
public interface IEnumerator<out T> : IDisposable, IEnumerator
```
```
{
```
```
T Current { get; } // Compiled to get_Current.T is covariant.
```
```
}
```
```
public interface IEnumerable<out T> : IEnumerable
```
```
{
```
```
IEnumerator<T> GetEnumerator();
```
```
}
```

}

First, In IEnumerator<T> interface, its type parameter is only used as output type of its Current property’s getter, which is compiled to get\_Current function. Apparently T is covariance for its function type, so that T is also covariant for IEnumerator<T> interface level. Then, in IEnumerable<T>, T is only used by GetEnumerator. Here IEnumerator<T> can be virtually viewed as a simple wrapper of get\_Current function, and GetEnumerator can be virtually viewed as a higher-order function that outputs (a wrapper of) get\_Current function. As discussed, T is covariant for get\_Current function, covariant for higher-order function GetEnumerator, and eventually covariant for IEnumerable<T> interface level.

Remote LINQ query is represented by IQueryable<T>, where T is also covariant:

namespace System.Linq
```
{
```
```
public interface IQueryable : IEnumerable
```
```
{
```
```
Type ElementType { get; }
```
```
Expression Expression { get; }
```
```
IQueryProvider Provider { get; }
```
```
}
```
```
public interface IQueryable<out T> : IEnumerable<T>, IEnumerable, IQueryable
```
```
{
```
```
}
```

}

IQueryable<T> implements IEnumerable<T>, Its type parameter T is only used by the GetEnumerator member from IEnumerable<T>, so apparently, T remains covariant for IQueryable<T>.

Variance brings convenience to LINQ queries. Take the Concat and Select local query methods as example:

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
public static IEnumerable<TSource> Concat<TSource>(
```
```
this IEnumerable<TSource>first, IEnumerable<TSource> second);
```
```
public static IEnumerable<TResult> Select<TSource, TResult>(
```
```
this IEnumerable<TSource> source, Func<TSource, TResult> selector);
```
```
}
```

}

In the following example, Concat is called with IEnumerable<Base> instance, so another IEnumerable<Base> instance is required. With covariance, IEnumerable<Derived> can substitute IEnumerable<Base>, so IEnumerable<Derived> argument can be directly passed to IEnumerable<base> parameter:

internal static void Concat(
```
IEnumerable<Base> enumerableOfBase, IEnumerable<Derived> enumerableOfDerived)
```
```
{
```
```
// Covariance of Concat input: IEnumerable<Derived> <: IEnumerable<Base>.
```
```
// Concat: (IEnumerable<Base>, IEnumerable<Base>) -> IEnumerable<Base>.
```
```
enumerableOfBase = enumerableOfBase.Concat(enumerableOfDerived);
```

}

In the following example, Select is called with IEnumerable<Derived> instance, and the output is stored as IEnumerable<Base> instance. According to the signature of Select, the selector function is required to be of Derived -> Base type. With covariance, selector function of Base -> Base, Derived -> Derived, and Base -> Derived types work as well:

internal static void Select(IEnumerable<Derived> enumerableOfDerived)
```
{
```
```
IEnumerable<Base> enumerableOfBase;
```
```
// Default with no variance.
```
```
// Select: (IEnumerable<Derived>, Derived -> Base) -> IEnumerable<Base>.
```
```
enumerableOfBase = enumerableOfDerived.Select(DerivedToBase);
```
```
// Covariance of Select input: IEnumerable<Derived> <: IEnumerable<Base>.
```
```
// Select: (IEnumerable<Base>, Base -> Base) -> IEnumerable<Base>.
```
```
enumerableOfBase = enumerableOfDerived.Select(BaseToBase);
```
```
// Covariance of Select output: IEnumerable<Derived> <: IEnumerable<Base>.
```
```
// Select: (IEnumerable<Derived>, Derived -> Derived) -> IEnumerable<Derived>.
```
```
enumerableOfBase = enumerableOfDerived.Select(DerivedToDerived);
```
```
// Covariance of Select input and output: IEnumerable<Derived> <: IEnumerable<Base>.
```
```
// Select: (IEnumerable<Base>, Base -> Derived) -> IEnumerable<Derived>.
```
```
enumerableOfBase = enumerableOfDerived.Select(BaseToDerived);
```

}

## Summary

This chapter discusses C#’s covariance and contravariance feature in the context of non-generic delegate types, generic delegate types, generic interfaces, generic higher-order function types, as well as arrays. Variances also brings convenience to LINQ query, since LINQ follows the pattern of fluent interface, which has covariant type parameter.