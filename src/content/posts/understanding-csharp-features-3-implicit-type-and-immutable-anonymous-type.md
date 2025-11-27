---
title: "Understanding C# Features (3) Implicit Type and Immutable Anonymous Type"
published: 2009-11-26
description: "\\] - \\]"
image: ""
tags: [".NET", "C#", "C# 3.0", "C# 4.0", "C# Features", "Dynamic", "Functional Programming", "LINQ", "LINQ via C#"]
category: "C#"
draft: false
lang: ""
---

\[[LINQ via C#](/posts/linq-via-csharp)\] - \[[C# Features](/archive/?tag=C%23%20Features)\]

## Local variable type inference

The [var keyword](https://msdn.microsoft.com/en-us/library/bb383973.aspx) is introduced since C# 3.0. Consider the local variable declaration and initialization:

```csharp
TypeName localVariable = value;
```

Since the type of localVariable can be inferred from the type of value, it is Ok to write code like this:

```csharp
var localVariable = value; // Compiler infers type of localVariable from type of value.
```

Here are some samples:

```csharp
var a = 1;
var b = 1.0;
var c = "Mark";
var d = null as Uri;
var e = default(IEnumerable<Person>);
var f = File.ReadAllLines(filePath);
var g = f.Length;
```

They are identical to:

```csharp
int a = 1;
double b = 1.0;
string c = "Mark";
Uri d = null;
IEnumerable<Person> e = default(IEnumerable<Person>);
string[] f = File.ReadAllLines(filePath);
int g = f.Length;
```

Please notice that type inference must be applied to local variables declaration and initialization statement. The following cannot be compiled:

```csharp
var a; // Compiler cannot infer the type of a.
var b = null; // Compiler cannot infer the type of b.

private var Func() // Compiler cannot infer the type of return value.
{
    throw new NotImplementedException();
}

private void Action(var paramter) // Compiler cannot infer the type of parameter.
{
    throw new NotImplementedException();
}
```

### var vs. explicit typing

Sometimes the “var” keyword seems somewhat convenient:

```csharp
Dictionary<string, IEnumerable<Person>> dictionary1 = GetDictionary();
var dictionary2 = GetDictionary();
```

But for consistency, It is a good practice to [use explicit type when possible, use var when needed](/posts/csharp-coding-guidelines-4-types), like anonymous type. This entire tutorial follows this.

### var vs. dynamic

C# 4.0 introduces another [keyword dynamic](https://msdn.microsoft.com/en-us/library/dd264741.aspx). var is totally different from dynamic:

-   var is for implicit typed local variables, which works at compiled time
-   dynamic is like System.Object. Compiler allow any operation on a dynamic object. Exception is thrown at runtime if operation is invalid..

The above invalid var examples can be compiled by replacing var with dynamic:

```csharp
dynamic a; // object a;
dynamic b = null; // object b = null;

private dynamic Func() // private object Func()
{
    throw new NotImplementedException();
}

private void Action(dynamic paramter) // private void Action(object paramter)
{
    throw new NotImplementedException();
}
```

## Immutable anonymous type

This feature provides a way to create an instance without specifying the type name:

```csharp
var dixin = new 
    { 
        Name = "Dixin", 
        Age = 30 
    };
```

Since the type name is unknown at design time, this is called a anonymous type. At compile time, the type definition will be generated:

```csharp
[CompilerGenerated]
[DebuggerDisplay(@"\{ Name = {Name}, Age = {Age} }", Type = "<Anonymous Type>")]
internal sealed class AnonymousType<TName, TAge>
{
    [DebuggerBrowsable(DebuggerBrowsableState.Never)]
    private readonly TName nameBackingField;

    [DebuggerBrowsable(DebuggerBrowsableState.Never)]
    private readonly TAge ageBackingField;

    [DebuggerHidden]
    public AnonymousType(TName name, TAge age)
    {
        this.nameBackingField = name;
        this.ageBackingField = age;
    }

    public TAge Age { get { return this.ageBackingField; } }

    public TName Name { get { return this.nameBackingField; } }

    [DebuggerHidden]
    public override bool Equals(object value)
    {
        AnonymousType<TName, TAge> anonymous = value as AnonymousType<TName, TAge>;
        return anonymous != null
            && EqualityComparer<TName>.Default.Equals(this.nameBackingField, anonymous.nameBackingField)
            && EqualityComparer<TAge>.Default.Equals(this.ageBackingField, anonymous.ageBackingField);
    }

    [DebuggerHidden]
    public override int GetHashCode()
    {
        int num = 0x7d068cce;
        num = (-1521134295 * num) + EqualityComparer<TName>.Default.GetHashCode(this.nameBackingField);
        return ((-1521134295 * num) + EqualityComparer<TAge>.Default.GetHashCode(this.ageBackingField));
    }

    [DebuggerHidden]
    public override string ToString()
    {
        StringBuilder builder = new StringBuilder();
        builder.Append("{ Name = ");
        builder.Append(this.nameBackingField);
        builder.Append(", Age = ");
        builder.Append(this.ageBackingField);
        builder.Append(" }");
        return builder.ToString();
    }
}
```

It is atomic/immutable type. And the instantiation code s compiled to constructor call:

```csharp
AnonymousType<string, int> dixin = new AnonymousType<string, int>("Dixin", 30);
```

However, at design time, the type definition is not generated yet, this is why var must be used.

### Reuse type definition

Anonymous type are reused by 2 anonymous instantiation if they have:

-   the same number of properties
-   the same names of properties
-   the same order of property
-   the same types of properties

For example:

```csharp
[TestMethod()]
public void ReuseAnonymousType()
{
    var anna = new { Name = "Anna", Age = 18 };
    var bill = new { Name = "Bill", Age = 19 };
    Assert.AreSame(anna.GetType(), bill.GetType()); // Passes.
}
```

### Equality

Compiler also generates a override of object.Equals(), two anonymous objects are equal if:

-   they are of the same anonymous type
-   their each property’s value are equal

```csharp
[TestMethod()]
public void AnonymousObjectEquality()
{
    Assert.AreEqual(
        new { Name = "Dixin", Age = 30 }, 
        new { Name = "Dixin", Age = 30 }); // Passes.
}
```