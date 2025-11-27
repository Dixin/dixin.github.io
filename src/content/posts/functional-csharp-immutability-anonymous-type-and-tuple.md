---
title: "C# Functional Programming In-Depth (12) Immutability, Anonymous Type, and Tuple"
published: 2019-06-13
description: "Immutability is an important aspect of functional programming. As discussed in the introduction chapter, imperative/object-oriented programming is usually mutable and stateful, and functional programm"
image: ""
tags: [".NET", "C#", "C# 3.0", "LINQ", "LINQ via C#", "C# Features", "Functional Programming", "Functional C#"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

Immutability is an important aspect of functional programming. As discussed in the introduction chapter, imperative/object-oriented programming is usually mutable and stateful, and functional programming encourages immutability without state change. There are many kinds of immutability. In C#, the relevant features can be categorized into 2 levels: immutability of a value, and immutability of a value’s internal state. Take local variable as example, a local variable can be immutable value, if once it is initialized to an instance, it cannot be altered it to different instance to it; a local variable can also have immutable state, if once the instance’s internal state is initialized, that instance’s internal state cannot be altered to different state.

In functional programming, immutability is an important practice. It makes code easier to write, test, and maintain in many cases. Apparently, mutation makes the code unpredictable, and could be a prominent source of bugs; while apparently immutability makes the code predictable, and easier for reasoning about the correctness. Immutable value and immutable state can also make code easier to scale. There is no in-place update, and there is no update conflict. So, immutability is thread-safe by nature, and greatly simplifies concurrent/parallel/multithreading programming.

With immutability, since data cannot be updated in-place, it must be transformed to new data. The disadvantage of immutability is, apparently, the transformation must create another new instance to have the updated state, which can be a performance overhead.

## Immutable value

Many functional languages support immutable value. In contrast to variable, once an immutable value is initialized with an instance, it cannot be reassigned so that it can never be altered to another different instance. As a C-like language, C# has variable, which is mutable by default. C# also has a number of language features for immutable value.

### Constant local

C# has a const keyword to define compile time constant local. It can be initialized from a constant value or a constant expression that can be evaluated at compiled time, then it cannot be changed at runtime. Constant local only works for primitive types, enumerations, decimal, string, and null for reference type. At compiled time, the reference to constant local is replaced by the actual constant value, and the constant local is removed. The following is a few examples:

internal static void ConstantLocal()
```
{
```
```
const int ImmutableInt32 = 1;
```
```
const int ImmutableInt32Sum = ImmutableInt32 + 2;
```
```
// Constant expression ImmutableInt32 + 2 is compiled to: 3.
```
```
const DayOfWeek ImmutableDayOfWeek = DayOfWeek.Saturday;
```
```
const decimal ImmutableDecimal = (1M + 2M) * 3M;
```
```
const string ImmutableString = "https://weblogs.asp.net/dixin";
```
```
const string ImmutableStringConcat = "https://" + "flickr.com/dixin";
```
```
const Uri ImmutableUri = null;
```
```
// Reassignment to above constant locals cannot be compiled.
```
```
int variableInt32 = Math.Max(ImmutableInt32, ImmutableInt32Sum);
```
```
// Compiled to: Math.Max(1, 3).
```
```
Trace.WriteLine(ImmutableString);
```
```
// Compiled to: Trace.WriteLine("https://weblogs.asp.net/dixin").
```

}

### Enumeration

Enumeration can be viewed as a group of immutable values of its underlying integral type (int by default). For example:

internal enum Day
```
{
```
```
Sun, Mon, Tue, Wed, Thu, Fri, Sat
```
```
}
```
```
// Compiled to:
```
```
internal enum CompiledDay : int
```
```
{
```
```
Sun = 0, Mon = 1, Tue = 2, Wed = 3, Thu = 4, Fri = 5, Sat = 6
```

}

As demonstrated in previous example, enumeration can be used as constant value. It can also be used in constant expression:

internal static void Enumeration()
```
{
```
```
Trace.WriteLine((int)Day.Mon); // Compiled to: Trace.WriteLine(1).
```
```
Trace.WriteLine(Day.Mon + 2); // Compiled to: Trace.WriteLine(Day.Wed).
```
```
Trace.WriteLine((int)Day.Mon + Day.Thu); // Compiled to: Trace.WriteLine(Day.Fri).
```
```
Trace.WriteLine(Day.Sat - Day.Mon); // Compiled to: Trace.WriteLine(5).
```

}

### using statement and foreach statement

C# also supports immutable value in the fore mentioned using statement and foreach statement:

internal static void Using(Func<IDisposable> disposableFactory)
```
{
```
```
using (IDisposable immutableDisposable = disposableFactory())
```
```
{
```
```
// Reassignment to immutableDisposable cannot be compiled.
```
```
}
```
```
}
```
```
internal static void ForEach<T>(IEnumerable<T> sequence)
```
```
{
```
```
foreach (T immutableValue in sequence)
```
```
{
```
```
// Reassignment to immutableValue cannot be compiled.
```
```
}
```

}

### Immutable alias (immutable ref local variable)

As discussed in the C# basics chapter, ref modifier can define alias for local variable, and readonly modifier can be used with ref modifier to make the alias immutable. Once an immutable alias is initialized with something, it cannot be alias of anything else:

internal static void ImmutableAlias()
```
{
```
```
int value = 1;
```
```
int copyOfValue = value; // Copy.
```
```
copyOfValue = 10; // After the assignment, value does not mutate.
```
```
ref int aliasOfValue = ref value; // Mutable alias.
```
```
aliasOfValue = 10; // After the reassignment, value mutates.
```
```
ref readonly int immutableAliasOfValue = ref value; // Immutable alias.
```
```
// Reassignment to immutableAliasOfValue cannot be compiled.
```
```
Uri reference = new Uri("https://weblogs.asp.net/dixin");
```
```
Uri copyOfReference = reference; // Copy.
```
```
copyOfReference = new Uri("https://flickr.com/dixin"); // After the assignment, reference does not mutate.
```
```
ref Uri aliasOfReference = ref reference; // Mutable alias.
```
```
aliasOfReference = new Uri("https://flickr.com/dixin"); // After the reassignment, reference mutates.
```
```
ref readonly Uri immutableAliasOfReference = ref reference; // Immutable alias.
```
```
// Reassignment to immutableAliasOfReference cannot be compiled.
```

}

### Function’s immutable input and immutable output

As discussed in the function input and output chapter, the in modifier enables function input by immutable alias (in parameter), and the readonly modifier can be used with ref modifier to enable output by immutable alias (ref readonly return):

internal static void ParameterAndReturn<T\>(Span<T> span)
```
{
```
```
ref readonly T First(in Span<T> immutableInput)
```
```
{
```
```
// Cannot reassign to immutableInput.
```
```
return ref immutableInput[0];
```
```
}
```
```
ref readonly T immutableOutput = ref First(in span);
```
```
// Cannot reassign to immutableOutput.
```

}

### Range variable in LINQ query expression

The function composition chapter discusses LINQ query expression where, let clause and other clauses can define range variable. LINQ range variable is not mutable variable but immutable value:

internal static void QueryExpression(IEnumerable<int> source1, IEnumerable<int> source2)
```
{
```
```
IEnumerable<IGrouping<int, int>> query =
```
```
from immutable1 in source1
```
```
// Reassignment to immutable1 cannot be compiled.
```
```
join immutable2 in source2 on immutable1 equals immutable2 into immutable3
```
```
// Reassignment to immutable2, immutable3 cannot be compiled.
```
```
let immutable4 = immutable1
```
```
// Reassignment to immutable4 cannot be compiled.
```
```
group immutable4 by immutable4 into immutable5
```
```
// Reassignment to immutable5 cannot be compiled.
```
```
select immutable5 into immutable6
```
```
// Reassignment to immutable6 cannot be compiled.
```
```
select immutable6;
```

}

### this reference for class

In class definition, this keyword can be used in instance function members to refer to the current instance of the class, and it is immutable:

internal partial class Device
```
{
```
```
internal void InstanceMethod()
```
```
{
```
```
// Reassignment to this cannot be compiled.
```
```
}
```

}

For structure, this reference is mutable by default, which is discussed later in this chapter.

## Immutable state (immutable type)

A type is immutable type, if once its instance is initialized, the internal state cannot mutate to different state. As a typical example, string (System.String) is an immutable type. Once a string instance is constructed, there is no API to mutate the internal characters of that string instance. For example, string.Remove does not remove specified characters in the string, but constructs a new string without the characters specified to remove. In contrast, string builder (System.Text.StringBuilder) is a mutable type. For example, StringBuilder.Remove mutates the internal characters in place. In .NET Standard, most classes are mutable types, and most structures are immutable types.

### Constant field

When defining type (class or structure), a field with the const modifier is static and immutable. It must be initialized by constant value or constant expression inline, and it cannot be reassigned. Similar to constant local, constant field only works for primitive types, enumerations, decimal, string, and null for reference type.

namespace System
```
{
```
```
public struct DateTime : IComparable, IComparable<DateTime>, IConvertible, IEquatable<DateTime>, IFormattable, ISerializable
```
```
{
```
```csharp
private const int DaysPerYear = 365;
```
```
// Compiled to:
```
```csharp
// .field private static literal int32 DaysPerYear = 365
```

```csharp
private const int DaysPer4Years = DaysPerYear * 4 + 1;
```
```
// Compiled to:
```
```csharp
// .field private static literal int32 DaysPer4Years = 1461
```
```
// Other members.
```
```
}
```

}

At compiled time, the reference to constant field is replaced by the actual constant value, and the constant field definition is not removed.

### Immutable class with readonly instance field

When the readonly modifier is used for a field, the field can only be initialized by constructor, and cannot be reassigned later. So an immutable class can be immutable by defining all instance fields as readonly:

internal partial class ImmutableDevice
```
{
```
```csharp
private readonly string name;
```

```csharp
private readonly decimal price;
```

}

With the fore mentioned auto property syntactic sugar, the readonly field definition can be automatically generated. The following examples are mutable type with read write fields generated from auto property, and immutable type with read only fields generated from getter only auto properties:

internal partial class MutableDevice
```
{
```
```
internal string Name { get; set; }
```
```
internal decimal Price { get; set; }
```
```
}
```
```
internal partial class ImmutableDevice
```
```
{
```
```
internal ImmutableDevice(string name, decimal price)
```
```
{
```
```
this.Name = name;
```
```
this.Price = price;
```
```
}
```
```
internal string Name { get; }
```
```
internal decimal Price { get; }
```

}

Apparently, to have new internal state, a mutable instance can mutate in place, by altering its fields, while an immutable instance must be transformed to a new instance to have the new state:

internal static void DevicePriceDrop()
```
{
```
```
MutableDevice mutableDevice = new MutableDevice() { Name = "Surface Laptop", Price = 799M };
```
```
mutableDevice.Price -= 50M;
```
```
ImmutableDevice immutableDevice = new ImmutableDevice(name: "Surface Book", price: 1199M);
```
```
immutableDevice = new ImmutableDevice(name: immutableDevice.Name, price: immutableDevice.Price - 50M);
```

}

The following examples defines instance method for new state with mutation and transformation:

internal partial class MutableDevice
```
{
```
```
internal MutableDevice Discount()
```
```
{
```
```
this.Price = this.Price * 0.9M;
```
```
return this;
```
```
}
```
```
}
```
```
internal partial class ImmutableDevice
```
```
{
```
```
internal ImmutableDevice Discount() =>
```
```
new ImmutableDevice(name: this.Name, price: this.Price * 0.9M);
```

}

Many .NET built-in types are immutable data structures, including most structures (primitive types, System.Nullable<T>, System.DateTime, System.TimeSpan, etc.), and a few classes (string, System.Lazy<T>, System.Linq.Expressions.Expression and its derived types, etc.). Microsoft also provides a NuGet package of immutable collections System.Collections.Immutable, with immutable array, list, dictionary, etc.

### Immutable structure (readonly structure)

The following structure is defined with getter only auto property, which generates readonly fields. The structure looks immutable:

internal partial struct Complex
```
{
```
```
internal Complex(double real, double imaginary)
```
```
{
```
```
this.Real = real;
```
```
this.Imaginary = imaginary;
```
```
}
```
```
internal double Real { get; }
```
```
internal double Imaginary { get; }
```

}

However, for structure, readonly fields are not enough for immutability. Unlike class, in structure’s instance function members, this reference is mutable:

internal partial struct Complex
```
{
```
```
internal Complex(Complex value) => this = value; // Can reassign to this.
```
```
internal Complex Value
```
```
{
```
```
get => this;
```
```
set => this = value; // Can reassign to this.
```
```
}
```
```
internal Complex ReplaceBy(Complex value) => this = value; // Can reassign to this.
```
```
internal Complex Mutate(double real, double imaginary) =>
```
```
this = new Complex(real, imaginary); // Can reassign to this.
```

}

With mutable this, the above structure still can be mutable:

internal static void Structure()
```
{
```
```
Complex complex = new Complex(1, 1);
```
```
complex.Real.WriteLine(); // 1
```
```
complex.ReplaceBy(new Complex(2, 2));
```
```
complex.Real.WriteLine(); // 2
```
```
complex.Mutate(3, 3);
```
```
complex.Real.WriteLine(); // 3
```

}

To address this, C# 7.2 enables the readonly modifier for structure definition to makes sure the structure is immutable. It enforces all the instance fields to be readonly, and makes this reference immutable in instance function members except constructor:

internal readonly partial struct ImmutableComplex
```
{
```
```
internal ImmutableComplex(double real, double imaginary)
```
```
{
```
```
this.Real = real;
```
```
this.Imaginary = imaginary;
```
```
}
```
```
internal ImmutableComplex(in ImmutableComplex value) =>
```
```
this = value; // Can reassign to this only in constructor.
```
```
internal double Real { get; }
```
```
internal double Imaginary { get; }
```
```
internal void InstanceMethod()
```
```
{
```
```
// Cannot reassign to this.
```
```
}
```

}

The readonly modifier is compiled to \[IsReadOnly\] attribute for the structure:

\[IsReadOnly\]
```
internal struct CompiledImmutableComplex
```
```
{
```
```
// Members.
```

}

### Immutable anonymous type

C# 3.0 introduces anonymous type to represent temporary data in an immutable form, without providing the type definition at design time:

internal static void AnonymousType()
```
{
```
```
var immutableDevice = new { Name = "Surface Book", Price = 1199M };
```

}

Since the type name is unknown at design time, the above instance is of an anonymous type, and the type name is represented by the var keyword. At compile time, the following immutable class is generated:

\[CompilerGenerated\]
```
[DebuggerDisplay(@"\{ Name = {Name}, Price = {Price} }", Type = "<Anonymous Type>")]
```
```
internal sealed class AnonymousType0<TName, TPrice>
```
```
{
```
```
[DebuggerBrowsable(DebuggerBrowsableState.Never)]
```
```csharp
private readonly TName name;
```
```
[DebuggerBrowsable(DebuggerBrowsableState.Never)]
```
```csharp
private readonly TPrice price;
```
```
[DebuggerHidden]
```
```
public AnonymousType0(TName name, TPrice price)
```
```
{
```
```
this.name = name;
```
```
this.price = price;
```
```
}
```
```
public TName Name => this.name;
```
```
public TPrice Price => this.price;
```
```
[DebuggerHidden]
```
```
[DebuggerHidden]
```
```
public override bool Equals(object obj)
```
```
{
```
```
AnonymousType0<TName, TPrice> other = obj as AnonymousType0<TName, TPrice>;
```
```
return other != null
```
```
&&EqualityComparer<TName>.Default.Equals(this.name, other.name)
```
```
&&EqualityComparer<TPrice>.Default.Equals(this.price, other.price);
```
```
}
```
```
// Other members.
```

}

The \[DebuggerDisplay\] attribute is generated for debug build, so that debugger can display the values in the specified friendly format.

And the above setting-property-like syntax is compiled to normal constructor call:

internal static void CompiledAnonymousType()
```
{
```
```
AnonymousType0<string, decimal>immutableDevice =
```
```
new AnonymousType0<string, decimal>(name: "Surface Book", price: 1199M);
```

}

If there are other different anonymous type used in the code, C# compiler generates more type definitions AnonymousType1, AnonymousType2, etc. Anonymous type is reused by different instantiation if their properties have same number, the same names, the same types, and the same order:

internal static void ReuseAnonymousType()
```
{
```
```
var device1 = new { Name = "Surface Book", Price = 1199M };
```
```
var device2 = new { Name = "Surface Pro", Price = 899M };
```
```
var device3 = new { Name = "Xbox One", Price = 399.00 }; // Price is of type double.
```
```
var device4 = new { Price = 174.99M, Name = "Surface Laptop" }; // Price is before Name.
```
```
(device1.GetType() == device2.GetType()).WriteLine(); // True
```
```
(device1.GetType() == device3.GetType()).WriteLine(); // False
```
```
(device1.GetType() == device4.GetType()).WriteLine(); // False
```

}

Anonymous type’s property name can be inferred from the identifier used to initialize the property. The following 2 anonymous type instantiations are equivalent:

internal static void PropertyInference(Uri uri, int value)
```
{
```
```
var anonymous1 = new { value, uri.Host };
```
```
var anonymous2 = new { value = value, Host = uri.Host };
```

}

Anonymous type can also be part of other types, like array, and type parameter for generic type, etc:

internal static void AnonymousTypeParameter()
```
{
```
```
var source = // Compiled to: AnonymousType0<string, decimal>[] source =.
```
```
new []
```
```
{
```
```
new { Name = "Surface Book", Price = 1199M },
```
```
new { Name = "Surface Pro", Price = 899M }
```
```
};
```
```
var query = // Compiled to: IEnumerable<AnonymousType0<string, decimal>> query = .
```
```
source.Where(device => device.Price > 0);
```

}

Here the source array is inferred to be of AnonymousType0<string, decimal>\[\] type, because each array value is of type AnonymousType0. Array T\[\] implements IEnumerable<T> interface, so the source array implements IEnumerable<AnonymousType0<string, decimal>> interface. Its Where query method accepts an AnonymousType0<string, decimal> –> bool predicate function, and outputs IEnumerable<AnonymousType0<string, decimal>>.

C# compiler utilizes anonymous type for let clause in LINQ query expression. The let clause is compiled to Select query method call with a selector function. The selector function outputs anonymous type, where each property is a range variable in the context. For example:

internal static void Let(IEnumerable<int\> source)
```
{
```
```
IEnumerable<double> query =
```
```
from immutable1 in source
```
```
let immutable2 = Math.Sqrt(immutable1)
```
```
select immutable1 + immutable2;
```
```
}
```
```
internal static void CompiledLet(IEnumerable<int>source)
```
```
{
```
```
IEnumerable<double> query = source
```
```
.Select(immutable1 => new { immutable1, immutable2 = Math.Sqrt(immutable1) }) // let clause.
```
```
.Select(context => context.immutable1 + context.immutable2); // select clause.
```

}

The full details of query expression compilation are discussed in the LINQ to Objects chapters.

### Local variable type inference

Besides local variable of anonymous type, the var keyword can be also used to initialize local variable of existing type:

internal static void LocalVariable(IEnumerable<int\> source, string path)
```
{
```
```
var a = default(int); // int.
```
```
var b = 1M; // decimal.
```
```
var c = typeof(void); // Type.
```
```
var d = from int32 in source where int32 > 0 select Math.Sqrt(int32); // IEnumerable<double>.
```
```
var e = File.ReadAllLines(path); // string[].
```

}

This is just a syntactic sugar. The local variable’s type is inferred from the initial value’s type. The compilation of implicit typed local variable has no difference from explicitly typed local variable. When the initial value’s type is ambiguous, the var keyword cannot be directly used:

internal static void LocalVariableWithType()
```
{
```
```
var f = (Uri)null;
```
```
var g = (Func<int, int>)(int32 => int32 + 1);
```
```
var h = (Expression<Func<int, int>>)(int32 => int32 + 1);
```

}

For consistency and readability, this book uses explicit typing when possible, uses implicit typing (var) when needed.

### Immutable tuple and mutable tuple

Tuple is a data structure commonly used in functional programming. It is a finite and ordered list of values, usually immutable in most functional languages. To represent tuple, a series of generic tuple classes with 1 - 8 type parameters are provided in .NET Standard. All tuple classes are immutable. For example, the following is the definition of Tuple<T1, T2>, which represents a 2-tuple (tuple of 2 values):

namespace System
```
{
```
```
[Serializable]
```

```csharp
public class Tuple<T1, T2> : IStructuralEquatable, IStructuralComparable, IComparable, ITupleInternal, ITuple
```
```
{
```
```csharp
private readonly T1 m_Item1;
```

```csharp
private readonly T2 m_Item2;
```
```
public Tuple(T1 item1, T2 item2)
```
```
{
```
```
this.m_Item1 = item1;
```
```
this.m_Item2 = item2;
```
```
}
```
```
public T1 Item1 => this.m_Item1;
```
```
public T2 Item2 => this.m_Item2;
```
```
// Other members.
```
```
}
```

}

Years after introducing tuple classes, C# 7.0 finally introduces tuple syntax. However, the tuple syntax does not work with above immutable tuple classes, but works with a new series of generic tuple structures with 1 ~ 8 type parameters. For example, 2-tuple is now represented by the following ValueTuple<T1, T2> structure:

namespace System
```
{
```
```
[StructLayout(LayoutKind.Auto)]
```
```
public struct ValueTuple<T1, T2> : IEquatable<ValueTuple<T1, T2>>, IStructuralEquatable, IStructuralComparable, IComparable, IComparable<ValueTuple<T1, T2>>, IValueTupleInternal, ITuple
```
```
{
```
```
public T1 Item1;
```
```
public T2 Item2;
```
```
public ValueTuple(T1 item1, T2 item2)
```
```
{
```
```
this.Item1 = item1;
```
```
this.Item2 = item2;
```
```
}
```
```
public override string ToString() =>
```
```
"(" + this.Item1?.ToString() + ", " + this.Item2?.ToString() + ")";
```
```
// Other members.
```
```
}
```

}

The tuple structures with fields are provided for better performance than tuple classes with properties, since structure can be allocated and deallocated on stack, and field access does not involve getter function member call. Unfortunately, all tuple structures are designed to be mutable types with non-readonly public fields. To be functional and consistent, this book does not use tuple classes, but only uses tuple structures and never mutate their value fields, as if tuple structures are immutable.

As above tuple definition shows, in contrast of list of values or array of values, tuple’s values can be of different types:

internal static void TypesOfValues()
```
{
```
```
ValueTuple<string, decimal> tuple = new ValueTuple<string, decimal>("Surface Book", 1199M);
```
```
string[] array = { "Surface Book", "1199M" };
```
```
List<string>list = new List<string>() { "Surface Book", "1199M" };
```

}

Tuple type and anonymous type are conceptually similar to each other, they are both a list of values of arbitrary types. At design time, tuple type is defined, and anonymous type is not defined yet. Therefore, anonymous type (var keyword) can only be used for local variable with immediate instantiation to infer the types of the values, and cannot be used as function input type, function output type, type argument, etc.:

internal static ValueTuple<string, decimal\> Function(ValueTuple<string, decimal\> values)
```
{
```
```
ValueTuple<string, decimal> variable1;
```
```
ValueTuple<string, decimal> variable2 = default;
```
```
IEnumerable<ValueTuple<string, decimal>>variable3;
```
```
return values;
```
```
}
```
```
internal static var Function(var values) // Cannot be compiled.
```
```
{
```
```
var variable1; // Cannot be compiled.
```
```
var variable2 = default; // Cannot be compiled.
```
```
IEnumerable<var> variable3; // Cannot be compiled.
```
```
return values;
```

}

### Construction, element and element inference

C# 7.0 introduces tuple syntactic sugar, which brings great convenience. The tuple type ValueTuple<T1, T2, T3, …> can be simplified to (T1, T2, T3, …), and the tuple construction new ValueTuple<T1, T2, T3, …>(value1, value2, value3, …) can be simplified to (value1, value2, value3, …):

internal static void TupleLiteral()
```
{
```
```
(string, decimal) tuple1 = ("Surface Pro", 899M);
```
```
// Compiled to:
```
```
// ValueTuple<string, decimal> tuple1 = new ValueTuple<string, decimal>("Surface Pro", 899M);
```
```
(int, bool, (string, decimal)) tuple2 = (1, true, ("Surface Studio", 2999M));
```
```
// ValueTuple<int, bool, ValueTuple<string, decimal>> tuple2 =
```
```
// new ValueTuple<int, bool, ValueTuple<string, decimal>>(1, true, new ValueTuple<string, decimal>("Surface Studio", 2999M));
```

}

When using tuple as the function output type, the tuple syntax virtually enables function to return multiple values:

internal static (string, decimal) OutputMultipleValues()
```
// Compiled to: internal static ValueTuple<string, decimal> OutputMultipleValues()
```
```
{
```
```
string value1 = default;
```
```
int value2 = default;
```
```
(string, decimal) Function() => (value1, value2);
```
```
// Compiled to: ValueTuple<string, decimal> Function() => new ValueTuple<string, decimal>(value1, value2);
```
```
Func<(string, decimal)> function = () => (value1, value2);
```
```
// Compiled to: Func<ValueTuple<string, decimal>> function = () => new ValueTuple<string, decimal>(value1, value2);
```
```
return (value1, value2);
```
```
// Compiled to : new ValueTuple<string, decimal>(value1, value2);
```

}

C# 7.0 also introduces element name, so that each value of the tuple type definition can be given a property-like name, with the syntax (T1 Name1, T2 Name2, T3 Name3, …), and each value of the tuple instance construction can be given a name too, with syntax (Name1: value1, Name2, value2, Name3 value3, …). So that the values in the tuple can be accessed with a meaningful name, instead of the actual Item1, Item2, Item3, … field names. This is also a syntactic sugar, at compile time, all element names are all replaced by the underlying fields.

internal static void ElementName()
```
{
```
```
(string Name, decimal Price) tuple1 = ("Surface Pro", 899M);
```
```
tuple1.Name.WriteLine();
```
```
tuple1.Price.WriteLine();
```
```
// Compiled to:
```
```
// ValueTuple<string, decimal> tuple1 = new ValueTuple<string, decimal>("Surface Pro", 899M);
```
```
// TraceExtensions.WriteLine(tuple1.Item1);
```
```
// TraceExtensions.WriteLine(tuple1.Item2);
```
```
(string Name, decimal Price) tuple2 = (ProductNanme: "Surface Book", ProductPrice: 1199M);
```
```
tuple2.Name.WriteLine(); // Element names on the right side are ignored when there are element names on the left side.
```
```
var tuple3 = (Name: "Surface Studio", Price: 2999M);
```
```
tuple3.Name.WriteLine(); // Element names are available through var.
```
```
ValueTuple<string, decimal> tuple4 = (Name: "Xbox One", Price: 179M);
```
```
tuple4.Item1.WriteLine(); // Element names are not available on ValueTuple<T1, T2> type.
```
```
tuple4.Item2.WriteLine();
```
```
(string Name, decimal Price) Function((string Name, decimal Price) tuple)
```
```
{
```
```
tuple.Name.WriteLine(); // Input tuple’s element names are available in function.
```
```
return (tuple.Name, tuple.Price - 10M);
```
```
}
```
```
var tuple5 = Function(("Xbox One S", 299M));
```
```
tuple5.Name.WriteLine(); // Output tuple’s element names are available through var.
```
```
tuple5.Price.WriteLine();
```
```
Func<(string Name, decimal Price), (string Name, decimal Price)> function = tuple =>
```
```
{
```
```
tuple.Name.WriteLine(); // Input tuple’s element names are available in function.
```
```
return (tuple.Name, tuple.Price - 100M);
```
```
};
```
```
(string ProductName, decimal ProductPrice) tuple6 = function(("HoloLens", 3000M));
```
```
tuple6.ProductName.WriteLine(); // Element names on the right side are ignored when there are element names on the left side.
```
```
tuple6.ProductPrice.WriteLine();
```

}

Similar to anonymous type’s property name inference, C# 7.1 can infer tuple’s element name from the identifier used to initialize the element. The following 2 tuple are equivalent:

internal static void ElementInference(Uri uri, int value)
```
{
```
```
var tuple1 = (value, uri.Host);
```
```
var tuple2 = (value: value, Host: uri.Host);
```

}

### Deconstruction

Since C# 7.0, the var keyword can also be used to deconstruct tuple to a list of values. This syntax is very useful when used with functions that outputs multiple values represented by tuple:

internal static void DeconstructTuple()
```
{
```
```
(string, decimal) GetProduct() => ("HoloLens", 3000M);
```
```
var (name, price) = GetProduct();
```
```
name.WriteLine();
```
```
price.WriteLine();
```

}

This deconstruction syntactic sugar can be used with any type, as long as that type has a Deconstruct instance or extension method defined, where the values as the out parameters. Take the fore mentioned Device type as example, it has 3 properties Name, Description, and Price, so its Deconstruct method can be either of the following 2 forms:

internal partial class Device
```
{
```
```
internal void Deconstruct(out string name, out string description, out decimal price)
```
```
{
```
```
name = this.Name;
```
```
description = this.Description;
```
```
price = this.Price;
```
```
}
```
```
}
```
```
internal static class DeviceExtensions
```
```
{
```
```
internal static void Deconstruct(this Device device, out string name, out string description, out decimal price)
```
```
{
```
```
name = device.Name;
```
```
description = device.Description;
```
```
price = device.Price;
```
```
}
```

}

Now the var keyword can destruct Device too, which is just compiled to Destruct method call:

internal static void DeconstructDevice()
```
{
```
```
Device GetDevice() => new Device() { Name = "Surface studio", Description = "All-in-one PC.", Price = 2999M };
```
```
var (name, description, price) = GetDevice();
```
```
// Compiled to:
```
```
// string name; string description; decimal price;
```
```
// surfaceStudio.Deconstruct(out name, out description, out price);
```
```
name.WriteLine();
```
```
description.WriteLine();
```
```
price.WriteLine();
```

}

### Discard

In tuple destruction, since the elements are compiled to out variables of the Destruct method, any element can be discarded with underscore just like discarding out variable:

internal static void Discard()
```
{
```
```
Device GetDevice() => new Device() { Name = "Surface studio", Description = "All-in-one PC.", Price = 2999M };
```
```
var (_, _, price1) = GetDevice();
```
```
price1.WriteLine();
```
```
(_, _, decimal price2) = GetDevice();
```
```
price2.WriteLine();
```

}

### Tuple assignment

With the tuple syntax, now C# can also support fancy tuple assignment, just like in Python and other languages. The following example assigns 2 values to 2 variables with a single line of code, then swap the values of 2 variables with a single line of code:

internal static void TupleAssignment(int value1, int value2)
```
{
```
```
(value1, value2) = (1, 2);
```
```
// Compiled to:
```
```
// value1 = 1; value2 = 2;
```
```
(value1, value2) = (value2, value1);
```
```
// Compiled to:
```
```
// int temp1 = value1; int temp2 = value2;
```
```
// value1 = temp2; value2 = temp1;
```

}

It is easy to calculate Fibonacci number with loop and tuple assignment:

internal static int Fibonacci(int n)
```
{
```
```
(int a, int b) = (0, 1);
```
```
for (int i = 0; i< n; i++)
```
```
{
```
```
(a, b) = (b, a + b);
```
```
}
```
```
return a;
```

}

Besides variables, tuple assignment works for other scenarios too, like type member. The following example assigns 2 values to 2 properties with a single line of code:

internal class ImmutableDevice
```
{
```
```
internal ImmutableDevice(string name, decimal price) =>
```
```
(this.Name, this.Price) = (name, price);
```
```
internal string Name { get; }
```
```
internal decimal Price { get; }
```

}

### Immutable collection vs. readonly collection

Microsoft provides immutable collections through the System.Collections.Immutable NuGet Package, including ImmutableArray<T>, ImmutableDictionary<TKey, TValue>, ImmutableHashSet<T>, ImmutableList<T>, ImmutableQueue<T>, ImmutableSet<T>, ImmutableStack<T>, etc. As fore mentioned, trying to mutate an immutable collection creates a new immutable collection:

internal static void ImmutableCollection()
```
{
```
```
ImmutableList<int> immutableList1 = ImmutableList.Create(1, 2, 3);
```
```
ImmutableList<int> immutableList2 = immutableList1.Add(4); // Create a new collection.
```
```
object.ReferenceEquals(immutableList1, immutableList2).WriteLine(); // False
```

}

.NET Standard also provides readonly collections, like ReadOnlyCollection<T>, ReadOnlyDictionary<TKey, TValue>, etc. These readonly collections are actually a simple wrapper of the specified collections. They just do not implement or expose mutation methods like Add, Remove, etc. They are not immutable or thread safe. The following example initializes an immutable collection and a readonly collection from a mutable source. When the source is mutated, the immutable collection apparently is not impacted, but the readonly collection mutates too:

internal static void ReadOnlyCollection()
```
{
```
```
List<int> mutableList = new List<int>() { 1, 2, 3 };
```
```
ImmutableList<int> immutableList = ImmutableList.CreateRange(mutableList);
```
```
ReadOnlyCollection<int>readOnlyCollection = new ReadOnlyCollection<int>(mutableList);
```
```
mutableList.Add(4);
```
```
immutableList.Count.WriteLine(); // 3
```
```
readOnlyCollection.Count.WriteLine(); // 4
```

}

### Shallow immutability vs. deep immutability

When working with immutable types, it is noteworthy that how immutable this type is. Take the following type as example, it represents a bundle of 2 devices:

internal class Bundle
```
{
```
```
internal Bundle(MutableDevice device1, MutableDevice device2) =>
```
```
(this.Device1, this.Device2) = (device1, device2);
```
```
internal MutableDevice Device1 { get; }
```
```
internal MutableDevice Device2 { get; }
```

}

This type is apparently immutable. Once it is initialized with 2 device instances, there is no way to alter these 2 instances to different instances. However, these 2 device instances are mutable, their names and prices can be altered in place:

internal static void ShallowImmutability()
```
{
```
```
MutableDevice device1 = new MutableDevice() { Name = "Surface Book", Price = 1199M };
```
```
MutableDevice device2 = new MutableDevice() { Name = "HoloLens", Price = 3000M };
```
```
Bundle bundle = new Bundle(device1, device2);
```
```
// Reassignment to bundle.Device1, bundle.Device2 cannot be compiled.
```
```
bundle.Device1.Name = "Surface Studio";
```
```
bundle.Device1.Price = 2999M;
```
```
bundle.Device2.Price -= 50M;
```

}

So, the above type is only immutable to a certain level. Below that level, mutation can happen. This is called shallow immutability. In contrast, the following type is more immutable:

internal class Bundle
```
{
```
```
internal Bundle(ImmutableDevice device1, ImmutableDevice device2) =>
```
```
(this.Device1, this.Device2) = (device1, device2);
```
```
internal ImmutableDevice Device1 { get; }
```
```
internal ImmutableDevice Device2 { get; }
```

}

This time a bundle consists of 2 immutable devices, and each immutable device consists of an immutable int value and an immutable string value. So, this type is immutable all levels down and completely thread-safe, which is called deep immutability.

## Summary

Immutability is important in functional programming. C# has a number of features for immutable value, including constant local, enumeration, using statement and foreach statement, immutable alias, function’s immutable input and immutable output, LINQ expression’s range variable, and this reference in class instance function members. To implement immutable state inside an instance, C# provides constant field and readonly field for type, readonly structure, immutable anonymous type, and tuple. Microsoft also provide a library of immutable collections.