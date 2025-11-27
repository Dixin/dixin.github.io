---
title: "C# Functional Programming In-Depth (12) Immutability, Anonymous Type, and Tuple"
published: 2018-06-12
description: "Immutability is an important aspect of functional paradigm. As fore mentioned, imperative/object-oriented programming is usually stateful, and functional programming encourages immutability without st"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

## **Latest version: [https://weblogs.asp.net/dixin/functional-csharp-immutability-anonymous-type-and-tuple](/posts/functional-csharp-immutability-anonymous-type-and-tuple "https://weblogs.asp.net/dixin/functional-csharp-immutability-anonymous-type-and-tuple")**[](/posts/functional-csharp-fundamentals "https://weblogs.asp.net/dixin/functional-csharp-fundamentals")

Immutability is an important aspect of functional paradigm. As fore mentioned, imperative/object-oriented programming is usually stateful, and functional programming encourages immutability without state change. In C# programming, there are [many kinds of immutability](https://blogs.msdn.microsoft.com/ericlippert/2007/11/13/immutability-in-c-part-one-kinds-of-immutability/), but they can be categorized into 2 levels: immutability of some value, and immutability of some value’s internal state. Take local variable as example, a local variable can be called immutable, if once it is assigned, there is no way to reassign to it; a local variable can also be called immutable, if once its internal state is initialized, there is no way to modify its state to different state.

Generally, immutability can make programming easier in many cases, since it gets rid of a major source of bugs. Immutable value and immutable state can also largely simplify concurrent/parallel/multithread programming, because they are thread-safe by nature. The disadvantage of immutability is, apparently, to change an immutable value or immutable state, another new instance must to be created with the mutation, which can cause performance overhead.

## Immutable value

Many functional languages support immutable value. In contrast to variable. Once a value is assigned with something, it cannot be reassigned so that it cannot be changed to anything else. For example, in F#, a value is immutable by default, unless the mutable keyword is specified:

```csharp
let value = new Uri("https://weblogs.asp.net/dixin") // Immutable value.
value <- null // Cannot be compiled. Cannot reassign to value.

let mutable variable = new Uri("https://weblogs.asp.net/dixin") // Mutable variable.
variable <- null // Can reassign to variable.
```

As a C-like language, C# variable is mutable by default. C# has a few other language features for immutable value.

### Constant

C# has a const keyword to define compile time constant, which cannot be changed at runtime. However, it only works for primitive types, string, and null reference:

```csharp
internal static partial class Immutability
{
    internal static void Const()
    {
        const int immutable1 = 1;
        const string immutable2 = "https://weblogs.asp.net/dixin";
        const object immutale3 = null;
        const Uri immutable4 = null;
        const Uri immutable5 = new Uri(immutable2); // Cannot be compiled.
    }
}
```

### using statement and foreach statement

C# also supports immutable value in a few statements, like the fore mentioned using and foreach statements:

```csharp
internal static void ForEach(IEnumerable<int> source)
{
    foreach (int immutable in source)
    {
        // Cannot reassign to immutable.
    }
}

internal static void Using(Func<IDisposable> disposableFactory)
{
    using (IDisposable immutable = disposableFactory())
    {
        // Cannot reassign to immutable.
    }
}
```

### this reference for class

In class definition, this keyword can be used in instance function members. It refers to the current instance of the class, and it is immutable:

```csharp
internal partial class Device
{
    internal void InstanceMethod()
    {
        // Cannot reassign to this.
    }
}
```

By default, this reference is mutable for structure definition, which is discussed later.

### Function’s readonly input and readonly output

The fore mentioned function parameter passed by readonly reference (in parameter) is immutable in the function, and function result retuned by readonly reference (ref readonly return) is immutable for the function’s caller:

```csharp
internal static void ParameterAndReturn<T>(Span<T> span)
{
    ref readonly T Last(in Span<T> immutableInput)
    {
        // Cannot reassign to immutableInput.
        int length = immutableInput.Length;
        if (length > 0)
        {
            return ref immutableInput[length - 1];
        }
        throw new ArgumentException("Span is empty.", nameof(immutableInput));
    }

    ref readonly T immutableOutput = ref Last(in span);
    // Cannot reassign to immutableOutput.
}
```

### Local variable by readonly reference (ref readonly variable)

C# 7.2 introduces readonly reference for local variable. In C#, when defining and initializing a new local variable with some existing local variable, there are 3 cases:

-   By copy: directly assign to local variable. If a value type instance is assigned, that value type instance is copied to a new instance; if a reference type instance is assigned, that reference is copied. So when the new local variable is reassigned, the previous local variable is not impacted.
-   By reference: assign to local variable with the ref keyword. The new local variable can be virtually viewed as a pointer or alias of the existing local variable. So when the new local variable is reassigned, it is equivalent to reassigning the previous local variable
-   By readonly reference: assign to local variable with the ref readonly keywords. The new local variable can be also virtually viewed as a pointer or alias, but in this case the new local variable is immutable, and cannot be reassigned.

```csharp
internal static void ReadOnlyReference()
{
    int value = 1;
    int copyOfValue = value; // Assign by copy.
    copyOfValue = 10; // After the assignment, value does not change.
    ref int mutaleRefOfValue = ref value; // Assign by reference.
    mutaleRefOfValue = 10; // After the reassignment, value changes too.
    ref readonly int immutableRefOfValue = ref value; // Assign by readonly reference.
    immutableRefOfValue = 0; // Cannot be compiled. Cannot reassign to immutableRefOfValue.

    Uri reference = new Uri("https://weblogs.asp.net/dixin");
    Uri copyOfReference = reference; // Assign by copy.
    copyOfReference = new Uri("https://flickr.com/dixin"); // After the assignment, reference does not change.
    ref Uri mutableRefOfReference = ref reference; // Assign by reference.
    mutableRefOfReference = new Uri("https://flickr.com/dixin"); // After the reassignment, reference changes too.
    ref readonly Uri immutableRefOfReference = ref reference; // Assign by readonly reference.
    immutableRefOfReference = null; // Cannot be compiled. Cannot reassign to immutableRefOfReference.
}
```

### Immutable value in LINQ query expression

In LINQ query expression introduced by C# 3.0, the from, join, let clauses can declare values, and the into query keyword can declare value too. These values are all immutable:

```csharp
internal static void QueryExpression(IEnumerable<int> source1, IEnumerable<int> source2)
{
    IEnumerable<IGrouping<int, int>> query =
        from immutable1 in source1
        // Cannot reassign to immutable1.
        join immutable2 in source2 on immutable1 equals immutable2 into immutable3
        // Cannot reassign to immutable2, immutable3.
        let immutable4 = immutable1
        // Cannot reassign to immutable4.
        group immutable4 by immutable4 into immutable5
        // Cannot reassign to immutable5.
        select immutable5 into immutable6
        // Cannot reassign to immutable6.
        select immutable6;
}
```

Query expression is a syntactic sugar of query method calls, which will be discussed in detail in LINQ to Objects chapter.

## Immutable state (immutable type)

Once an instance is constructed from an immutable type, the instance’s internal data cannot be changed. In C#, string (System.String) is an immutable type. Once a string is constructed, there is no API to change that string. For example, string.Remove does not change the string but always return a newly constructed string with specified characters removed. In contrast, string builder (System.Text.StringBuilder) is a mutable type. For example, StringBuilder.Remove actually change the string to remove the specified characters. In the core library, most classes are mutable types, and most structures are immutable types.

### Type’s constant field

When defining type (class or structure), a field with the const modifier is immutable. Again, it only works for primitive types, string, and null reference.

```csharp
namespace System
{
    public struct DateTime : IComparable, IComparable<DateTime>, IConvertible, IEquatable<DateTime>, IFormattable, ISerializable
    {
        private const int DaysPerYear = 365;
        // Compiled to:
        // .field private static literal int32 DaysPerYear = 365

        private const int DaysPer4Years = DaysPerYear * 4 + 1;
        // Compiled to:
        // .field private static literal int32 DaysPer4Years = 1461

        // Other members.
    }
}
```

### Immutable class with readonly instance field

When the readonly modifier is used for a field, the field can only be initialized by constructor, and cannot be reassigned later. So an immutable class can be immutable by defining all instance fields as readonly:

```csharp
internal partial class ImmutableDevice
{
    private readonly string name;

    private readonly decimal price;
}
```

With the fore mentioned auto property syntactic sugar, the readonly field definition can be automatically generated. The following is an example of mutable data type with read write state, and immutable data type with readonly state stored in readonly instance fields:

```csharp
internal partial class MutableDevice
{
    internal string Name { get; set; }

    internal decimal Price { get; set; }
}

internal partial class ImmutableDevice
{
    internal ImmutableDevice(string name, decimal price)
    {
        this.Name = name;
        this.Price = price;
    }

    internal string Name { get; }

    internal decimal Price { get; }
}
```

Apparently, constructed MutableDevice instance can change its internal state stored by fields, and ImmutableDevice instance cannot:

```csharp
internal static void State()
{
    MutableDevice mutableDevice = new MutableDevice() { Name = "Microsoft Band 2", Price = 249.99M };
    // Price drops.
    mutableDevice.Price -= 50M;

    ImmutableDevice immutableDevice = new ImmutableDevice(name: "Surface Book", price: 1349.00M);
    // Price drops.
    immutableDevice = new ImmutableDevice(name: immutableDevice.Name, price: immutableDevice.Price - 50M);
}
```

Since the instance of immutable type cannot change state, it gets rid of a major source of bugs, and it is always thread safe. But these benefits come with a price. It is common to update some existing data to different value, for example, have a discount based on the current price:

```csharp
internal partial class MutableDevice
{
    internal void Discount() => this.Price = this.Price * 0.9M;
}

internal partial class ImmutableDevice
{
    internal ImmutableDevice Discount() => new ImmutableDevice(name: this.Name, price: this.Price * 0.9M);
}
```

When discounting the the price, MutableDevice.Discount directly changes the state. ImmutableDevice.Discount cannot do this, so it has to construct a new instance with the new state, then return the new instance, which is also immutable. This is a performance overhead.

Many .NET built-in types are immutable data structures, including most value types (primitive types, System.Nullable<T>, System.DateTime, System.TimeSpan, etc.), and some reference types (string, System.Lazy<T>, System.Linq.Expressions.Expression and its derived types, etc.). Microsoft also provides a NuGet package of immutable collections [System.Collections.Immutable](https://www.nuget.org/packages/System.Collections.Immutable), with immutable array, list, dictionary, etc.

### Immutable structure (readonly structure)

The following structure is defined with the same pattern as above immutable class. The structure looks immutable:

```csharp
internal partial struct Complex
{
    internal Complex(double real, double imaginary)
    {
        this.Real = real;
        this.Imaginary = imaginary;
    }

    internal double Real { get; }

    internal double Imaginary { get; }
}
```

With the auto property syntactic sugar, readonly fields are generated. However, for structure, readonly fields are not enough for immutability. In contrast of class, in structure’s instance function members, this reference is mutable:

```csharp
internal partial struct Complex
{
    internal Complex(Complex value) => this = value; // Can reassign to this.

    internal Complex Value
    {
        get => this;
        set => this = value; // Can reassign to this.
    }

    internal Complex ReplaceBy(Complex value) => this = value; // Can reassign to this.

    internal Complex Mutate(double real, double imaginary) => 
        this = new Complex(real, imaginary); // Can reassign to this.
}
```

With mutable this, the above structure still can be mutable:

```csharp
internal static void Structure()
{
    Complex complex1 = new Complex(1, 1);
    Complex complex2 = new Complex(2, 2);
    complex1.Real.WriteLine(); // 1
    complex1.ReplaceBy(complex2);
    complex1.Real.WriteLine(); // 2
}
```

To address this scenario, C# 7.2 enables the readonly modifier for structure definition. To make sure the structure is immutable, It enforces all the instance fields to be readonly, and makes this reference immutable in instance function members except constructor:

```csharp
internal readonly partial struct ImmutableComplex
{
    internal ImmutableComplex(double real, double imaginary)
    {
        this.Real = real;
        this.Imaginary = imaginary;
    }

    internal ImmutableComplex(in ImmutableComplex value) => 
        this = value; // Can reassign to this only in constructor.

    internal double Real { get; }

    internal double Imaginary { get; }

    internal void InstanceMethod()
    {
        // Cannot reassign to this.
    }
}
```

### Immutable anonymous type

C# 3.0 introduces anonymous type to represent immutable data, without providing the type definition at design time:

```csharp
internal static void AnonymousType()
{
    var immutableDevice = new { Name = "Surface Book", Price = 1349.00M };
}
```

Since the type name is unknown at design time, the above instance is of an anonymous type, and the type name is represented by the var keyword. At compile time, the following immutable data type definition is generated:

```csharp
[CompilerGenerated]
[DebuggerDisplay(@"\{ Name = {Name}, Price = {Price} }", Type = "<Anonymous Type>")]
internal sealed class AnonymousType0<TName, TPrice>
{
    [DebuggerBrowsable(DebuggerBrowsableState.Never)]
    private readonly TName name;

    [DebuggerBrowsable(DebuggerBrowsableState.Never)]
    private readonly TPrice price;

    [DebuggerHidden]
    public AnonymousType0(TName name, TPrice price)
    {
        this.name = name;
        this.price = price;
    }

    public TName Name => this.name;

    public TPrice Price => this.price;

    [DebuggerHidden]
    public override bool Equals(object value) =>
        value is AnonymousType0<TName, TPrice> anonymous
        && anonymous != null
        && EqualityComparer<TName>.Default.Equals(this.name, anonymous.name)
        && EqualityComparer<TPrice>.Default.Equals(this.price, anonymous.price);

    // Other members.
}
```

And the above setting-property-like syntax is compiled to normal constructor call:

```csharp
internal static void CompiledAnonymousType()
{
    AnonymousType0<string, decimal> immutableDevice = new AnonymousType0<string, decimal>(
        name: "Surface Book", price: 1349.00M);
}
```

If there are other different anonymous type used in the code, C# compiler generates more type definitions AnonymousType1, AnonymousType2, etc. Anonymous type are reused by different instantiation if their properties have same number, names, types, and order:

```csharp
internal static void ReuseAnonymousType()
{
    var device1 = new { Name = "Surface Book", Price = 1349.00M };
    var device2 = new { Name = "Surface Pro 4", Price = 899.00M };
    var device3 = new { Name = "Xbox One S", Price = 399.00 }; // Price is of type double.
    var device4 = new { Price = 174.99M, Name = "Microsoft Band 2" };
    (device1.GetType() == device2.GetType()).WriteLine(); // True
    (device1.GetType() == device3.GetType()).WriteLine(); // False
    (device1.GetType() == device4.GetType()).WriteLine(); // False
}
```

Anonymous type’s property name can be inferred from the identifier used to initialize the property. The following 2 anonymous type instantiation are equivalent:

```csharp
internal static void PropertyInference(Uri uri, int value)
{
    var anonymous1 = new { value, uri.Host };
    var anonymous2 = new { value = value, Host = uri.Host };
}
```

Anonymous type can also be part of other types, like array, and type parameter for generic type, etc:

```csharp
internal static void AnonymousTypeParameter()
{
    var source = new[] // AnonymousType0<string, decimal>[].
    {
        new { Name = "Surface Book", Price = 1349.00M },
        new { Name = "Surface Pro 4", Price = 899.00M }
    };
    var query = // IEnumerable<AnonymousType0<string, decimal>>.
        source.Where(device => device.Price > 0);
}
```

Here the source array is inferred to be of AnonymousType0<string, decimal>\[\] type, because each array value is of type AnonymousType0. Array T\[\] implements IEnumerable<T> interface, so the source array implements IEnumerable<AnonymousType0<string, decimal>> interface. Its Where extension method accepts a AnonymousType0<string, decimal> –> bool predicate function, and returns IEnumerable<AnonymousType0<string, decimal>>.

C# compiler utilizes anonymous type for let clause in LINQ query expression. The let clause is compiled to Select query method call with a selector function returning anonymous type. For example:

```csharp
internal static void Let(IEnumerable<int> source)
{
    IEnumerable<double> query =
        from immutable1 in source
        let immutable2 = Math.Sqrt(immutable1)
        select immutable1 + immutable2;
}

internal static void CompiledLet(IEnumerable<int> source)
{
    IEnumerable<double> query = source // from clause.
        .Select(immutable1 => new { immutable1, immutable2 = Math.Sqrt(immutable1) }) // let clause.
        .Select(anonymous => anonymous.immutable1 + anonymous.immutable2); // select clause.
}
```

The full details of query expression compilation is covered in the LINQ to Objects chapter.

### Local variable type inference

Besides local variable of anonymous type, the [var keyword](https://msdn.microsoft.com/en-us/library/bb383973.aspx) can be also used to initialize local variable of existing type:

```csharp
internal static void LocalVariable(IEnumerable<int> source, string path)
{
    var a = default(int); // int.
    var b = 1M; // decimal.
    var c = typeof(void); // Type.
    var d = from int32 in source where int32 > 0 select Math.Sqrt(int32); // IEnumerable<double>.
    var e = File.ReadAllLines(path); // string[].
}
```

This is just a syntactic sugar. The local variable’s type is inferred from the initial value’s type. The compilation of implicit typed local variable has no difference from explicitly typed local variable. When the initial value’s type is ambiguous, the var keyword cannot be directly used:

```csharp
internal static void LocalVariableWithType()
{
    var f = (Uri)null;
    var g = (Func<int, int>)(int32 => int32 + 1);
    var h = (Expression<Func<int, int>>)(int32 => int32 + 1);
}
```

For consistency and readability, this tutorial [uses explicit typing when possible, uses implicit typing (var) when needed](/posts/csharp-coding-guidelines-4-types) (for anonymous type).

### Immutable tuple vs. mutable tuple

Tuple is another kind of data structure commonly used in functional programming. It is a finite and ordered list of values, usually immutable in most functional languages. To represent tuple, a series of generic tuple classes with 1 ~ 8 type parameters are provided since .NET Framework 3.5. For example, the following is the definition of Tuple<T1, T2>, which represents a 2-tuple (tuple of 2 values):

```csharp
namespace System
{
    [Serializable]
    public class Tuple<T1, T2> : IStructuralEquatable, IStructuralComparable, IComparable, ITuple
    {
        public Tuple(T1 item1, T2 item2)
        {
            this.Item1 = item1;
            this.Item2 = item2;
        }

        public T1 Item1 { get; }

        public T2 Item2 { get; }

        // Other members.
    }
}
```

All tuple classes are immutable. The latest C# 7.0 introduces tuple syntax, which work with a series of generic tuple structures with 1 ~ 8 type parameters. For example, 2-tuple is now represented by the following ValueTuple<T1, T2> structure:

```csharp
namespace System
{
    [StructLayout(LayoutKind.Auto)]
    public struct ValueTuple<T1, T2> : IEquatable<ValueTuple<T1, T2>>, IStructuralEquatable, IStructuralComparable, IComparable, IComparable<ValueTuple<T1, T2>>, ITupleInternal
    {
        public T1 Item1;

        public T2 Item2;

        public ValueTuple(T1 item1, T2 item2)
        {
            this.Item1 = item1;
            this.Item2 = item2;
        }

        public override bool Equals(object obj) => obj is ValueTuple<T1, T2> tuple && this.Equals(tuple);

        public bool Equals(ValueTuple<T1, T2> other) =>
            EqualityComparer<T1>.Default.Equals(this.Item1, other.Item1)
            && EqualityComparer<T2>.Default.Equals(this.Item2, other.Item2);

        public int CompareTo(ValueTuple<T1, T2> other)
        {
            int compareItem1 = Comparer<T1>.Default.Compare(this.Item1, other.Item1);
            return compareItem1 != 0 ? compareItem1 : Comparer<T2>.Default.Compare(this.Item2, other.Item2);
        }

        public override string ToString() => $"({this.Item1}, {this.Item2})";

        // Other members.
    }
}
```

The value tuple is provided for better performance, since it does not managed heap allocation and garbage collection. However, all value tuple structures become mutable types, where the values are just public fields. To be functional and consistent, this tutorial only uses value tuples, and only use them as immutable types.

As above tuple definition shows, in contrast of list, tuple’s values can be of different types:

```csharp
internal static void TupleAndList()
{
    ValueTuple<string, decimal> tuple = new ValueTuple<string, decimal>("Surface Book", 1349M);
    List<string> list = new List<string>() { "Surface Book", "1349M" };
}
```

Tuple type and anonymous type are conceptually similar to each other, they are both a set of properties returning a list of values. The major difference is, at design time, the tuple type is defined, and anonymous type is not defined yet. Therefore, anonymous type (var) can only be used for local variable with initial value to infer the expected type from, and cannot be used as parameter type, return type, type argument, etc.:

```csharp
internal static ValueTuple<string, decimal> Method(ValueTuple<string, decimal> values)
{
    ValueTuple<string, decimal> variable1;
    ValueTuple<string, decimal> variable2 = default;
    IEnumerable<ValueTuple<string, decimal>> variable3;
    return values;
}

internal static var Method(var values) // Cannot be compiled.
{
    var variable1; // Cannot be compiled.
    var variable2 = default; // Cannot be compiled.
    IEnumerable<var> variable3; // Cannot be compiled.
    return values;
}
```

### Construction, element and element inference

C# 7.0 introduces tuple syntactic sugar, which brings great convenience. The tuple type ValuTuple<T1, T2, T3, …> can be simplified to (T1, T2, T3, …), and the tuple construction new ValueTuple<T1, T2, T3, …>(value1, value2, value3, …) can be simplified to (value1, value2, value3, …):

```csharp
internal static void TupleTypeLiteral()
{
    (string, decimal) tuple1 = ("Surface Pro 4", 899M);
    // Compiled to: 
    // ValueTuple<string, decimal> tuple1 = new ValueTuple<string, decimal>("Surface Pro 4", 899M);

    (int, bool, (string, decimal)) tuple2 = (1, true, ("Surface Studio", 2999M));
    // ValueTuple<int, bool, ValueTuple<string, decimal>> tuple2 = 
    //    new ValueTuple<int, bool, new ValueTuple<string, decimal>>(1, true, ("Surface Studio", 2999M))
}
```

Apparently, tuple can be function’s parameter/return type, just like other types. When using tuple as the function return type, the tuple syntax virtually enables function to return multiple values:

```csharp
internal static (string, decimal) MethodReturnMultipleValues()
// internal static ValueTuple<string, decimal> MethodReturnMultipleValues()
{
    string returnValue1 = default;
    int returnValue2 = default;

    (string, decimal) Function() => (returnValue1, returnValue2);
    // ValueTuple<string, decimal> Function() => new ValueTuple<string, decimal>(returnValue1, returnValue2);

    Func<(string, decimal)> function = () => (returnValue1, returnValue2);
    // Func<ValueTuple<string, decimal>> function = () => new ValueTuple<string, decimal>(returnValue1, returnValue2);

    return (returnValue1, returnValue2);
}
```

C# 7.0 also introduces element name for tuple, so that each value of the tuple type can be given a property-like name, with the syntax (T1 Name1, T2 Name2, T3 Name3, …), and each value of the tuple instance can be given a name too, with syntax (Name1: value1, Name2, value2, Name3 value3, …). So that the values in the tuple can be accessed with a meaningful name, instead of the actual Item1, Item2, Item3, … field names. This is also a syntactic sugar, at compile time, all element names are all replaced by the underlying fields.

```csharp
internal static void ElementName()
{
    (string Name, decimal Price) tuple1 = ("Surface Pro 4", 899M);
    tuple1.Name.WriteLine();
    tuple1.Price.WriteLine();
    // Compiled to: 
    // ValueTuple<string, decimal> tuple1 = new ValueTuple<string, decimal>("Surface Pro 4", 899M);
    // TraceExtensions.WriteLine(tuple1.Item1);
    // TraceExtensions.WriteLine(tuple1.Item2)

    (string Name, decimal Price) tuple2 = (ProductNanme: "Surface Book", ProductPrice: 1349M);
    tuple2.Name.WriteLine(); // Element names on the right side are ignore.

    var tuple3 = (Name: "Surface Studio", Price: 2999M);
    tuple3.Name.WriteLine(); // Element names are available through var.

    ValueTuple<string, decimal> tuple4 = (Name: "Xbox One", Price: 179M);
    tuple4.Item1.WriteLine(); // Element names are not available on ValueTuple<T1, T2>.
    tuple4.Item2.WriteLine();

    (string Name, decimal Price) Function((string Name, decimal Price) tuple)
    {
        tuple.Name.WriteLine(); // Parameter element names are available in function.
        return (tuple.Name, tuple.Price - 10M);
    };
    var tuple5 = Function(("Xbox One S", 299M));
    tuple5.Name.WriteLine(); // Return value element names are available through var.
    tuple5.Price.WriteLine();

    Func<(string Name, decimal Price), (string Name, decimal Price)> function = tuple =>
    {
        tuple.Name.WriteLine(); // Parameter element names are available in function.
        return (tuple.Name, tuple.Price - 100M);
    };
    var tuple6 = function(("HoloLens", 3000M));
    tuple5.Name.WriteLine(); // Return value element names are available through var.
    tuple5.Price.WriteLine();
}
```

Similar to anonymous type’s property inference, C# 7.1 can infer tuple’s element name from the identifier used to initialize the element. The following 2 tuple are equivalent:

```csharp
internal static void ElementInference(Uri uri, int value)
{
    var tuple1 = (value, uri.Host);
    var tuple2 = (value: value, Host: uri.Host);
}
```

### Deconstruction

Since C# 7.0, the var keyword can also be used to deconstruct tuple to a list of values. This syntax is very useful when used with functions returning multiple values represented by tuple:

```csharp
internal static void DeconstructTuple()
{
    (string, decimal) GetProductInfo() => ("HoLoLens", 3000M);
    var (name, price) = GetProductInfo();
    name.WriteLine(); // name is string.
    price.WriteLine(); // price is decimal.
}
```

This deconstruction syntactic sugar can be used with any type, as long as that type has a Deconstruct instance or extension method defined, where the values as the out parameters. Take the fore mentioned Device type as example, It has 3 properties Name, Description, and Price, so its Deconstruct method can be either one of the following 2 forms:

```csharp
internal partial class Device
{
    internal void Deconstruct(out string name, out string description, out decimal price)
    {
        name = this.Name;
        description = this.Description;
        price = this.Price;
    }
}

internal static class DeviceExtensions
{
    internal static void Deconstruct(this Device device, out string name, out string description, out decimal price)
    {
        name = device.Name;
        description = device.Description;
        price = device.Price;
    }
}
```

Now the var keyword can destruct Device too, which is just compiled to Destruct method call:

```csharp
internal static void DeconstructDevice()
{
    Device GetDevice() => new Device() { Name = "Surface studio", Description = "All-in-one PC.", Price = 2999M };
    var (name, description, price) = GetDevice();
    // Compiled to:
    // string name; string description; decimal price;
    // surfaceStudio.Deconstruct(out name, out description, out price);
    name.WriteLine(); // Surface studio
    description.WriteLine(); // All-in-one PC.
    price.WriteLine(); // 2999
}
```

### Discard

In tuple destruction, since the elements are compiled to out variables of the Destruct method, any element can be discarded with underscore just like a out variable:

```csharp
internal static void Discard()
{
    Device GetDevice() => new Device() { Name = "Surface studio", Description = "All-in-one PC.", Price = 2999M };
    var (_, _, price1) = GetDevice();
    (_, _, decimal price2) = GetDevice();
}
```

### Tuple assignment

With the tuple syntax, now C# can also support fancy tuple assignment, just like Python and other languages. The following example assigns 2 values to 2 variables with a single line of code, then swap the values of 2 variables with a single line of code:

```csharp
internal static void TupleAssignment(int value1, int value2)
{
    (value1, value2) = (1, 2);
    // Compiled to:
    // value1 = 1; value2 = 2;

    (value1, value2) = (value2, value1);
    // Compiled to:
    // int temp1 = value1; int temp2 = value2;
    // value1 = temp2; value2 = temp1;
}
```

It is easy to calculate Fibonacci number with loop and tuple assignment:

```csharp
internal static int Fibonacci(int n)
{
    (int a, int b) = (0, 1);
    for (int i = 0; i < n; i++)
    {
        (a, b) = (b, a + b);
    }
    return a;
}
```

Besides variables, tuple assignment works for other scenarios too, like type member. The following example assigns 2 values to 2 properties with a single line of code:

```csharp
internal class ImmutableDevice
{
    internal ImmutableDevice(string name, decimal price) =>
        (this.Name, this.Price) = (name, price);

    internal string Name { get; }

    internal decimal Price { get; }
}
```

## Immutability vs. readonly

### Immutable collection vs. readonly collection

Microsoft provides immutable collections through the System.Collections.Immutable NuGet Package, including ImmutableArray<T>, ImmutableDictionary<TKey, TValue>, ImmutableHashSet<T>, ImmutableList<T>, ImmutableQueue<T>, ImmutableSet<T>, ImmutableStack<T>, etc. As fore mentioned, trying to changing an immutable collection creates a new immutable collection:

```csharp
internal static void ImmutableCollection()
{
    ImmutableList<int> immutableList1 = ImmutableList.Create(1, 2, 3);
    ImmutableList<int> immutableList2 = immutableList1.Add(4); // Create a new collection.
    object.ReferenceEquals(immutableList1, immutableList2).WriteLine(); // False
}
```

.NET/Core also provides readonly collections, like ReadOnlyCollection<T>, ReadOnlyDictionary<TKey, TValue>, etc., which can be confusing. These readonly collections are actually a simple wrapper of mutable collections. They just do not implement and expose methods like Add, Remove, which are used to change the collection. They are neither immutable, nor thread safe. The following example creates an immutable collection and a readonly collection from a mutable source. When the source is changed, the immutable collection apparently is not changed, but the readonly collection is changed:

```csharp
internal static void ReadOnlyCollection()
{
    List<int> mutableList = new List<int>() { 1, 2, 3 };
    ImmutableList<int> immutableList = ImmutableList.CreateRange(mutableList);
    ReadOnlyCollection<int> readOnlyCollection = new ReadOnlyCollection<int>(mutableList);
    // ReadOnlyCollection<int> wraps a mutable source, just has no methods like Add, Remove, etc.

    mutableList.Add(4);
    immutableList.Count.WriteLine(); // 3
    readOnlyCollection.Count.WriteLine(); // 4
}
```