---
title: "Understanding C# Features (1) Auto Property"
published: 2009-11-26
description: "\\] - \\]"
image: ""
tags: [".NET", "C#", "C# 3.0", "LINQ", "LINQ via C#", "C# Features"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C#](/posts/linq-via-csharp)\] - \[[C# Features](/archive/?tag=C%23%20Features)\]

As the fundamental of LINQ, This chapter will explain the new language features of C# 3.0, all of which are [syntactic sugars](https://en.wikipedia.org/wiki/Syntactic_sugar).

## Auto property

Before C# 3.0, a property has be with a getter/setter body:

```csharp
public class Person
{
    private string name;

    public string Name
    {
        get { return this.name; }
        set { this.name = value; }
    }
}
```

It is annoying when a class has many properties for data. So C# 3.0+ supports auto property:

```csharp
public class Person
{
    public string Name { get; set; }
}
```

which is a syntactic sugar. The compiler will generate the field definition and getter/setter body:

```csharp
public class Person
{
    [CompilerGenerated]
    private string nameBackingField;

    public string Name
    {
        [CompilerGenerated]
        get { return this.nameBackingField; }

        [CompilerGenerated]
        set { this.nameBackingField = value; }
    }
}
```

Above 3 versions of Person class work the same. works the same as the first sample.

## Getter only auto property

In programming, especially functional programming, it is a good practice to design [atomic/immutable types](/posts/csharp-coding-guidelines-4-types):

```csharp
public class Person
{
    public Person(string name)
    {
        this.Name = name;
    }

    public string Name { get; private set; }
}
```

C# 6.0 introduced more syntactic sugar to further simplify above code, so private setter can be omitted:

```csharp
public class Person
{
    public Person(string name)
    {
        this.Name = name;
    }

    public string Name { get; }
}
```

For getter only auto property, compiler generates read only backing field. So getter only auto property can only be initialized from constructor, or from property initializer:

```csharp
public class Person
{
    public Person(string name)
    {
        this.Name = name;
    }

    public string Name { get; }

    public Guid Id { get; } = Guid.NewGuid();
}
```

Above code will be compiled to:

```csharp
public class Person
{
    [CompilerGenerated]
    private readonly string nameBackingField;

    [CompilerGenerated]
    private readonly Guid idBackingField = Guid.NewGuid();

    public Person(string name)
    {
        this.nameBackingField = name;
    }

    public string Name
    {
        [CompilerGenerated]
        get { return this.nameBackingField; }
    }

    public Guid Id
    {
        [CompilerGenerated]
        get { return this.idBackingField; }
    }
}
```

## Auto property initializer

So getter only auto property can only be initialized from constructor, or from auto property initializer:

```csharp
public class Person
{
    public Person(string name)
    {
        this.Name = name;
    }

    public string Name { get; }

    public Guid Id { get; } = Guid.NewGuid();
}
```

## Expression bodied property-like function member

Since C# 3.0, the following Person class can be defined:

```csharp
public class Person
{
    public Person(string firstName, string lastName)
    {
        this.FirstName = firstName;
        this.LastName = lastName;
    }

    public string FirstName { get; private set; }

    public string LastName { get; private set; }

    public string FullName
    {
        get
        {
            return string.Format(CultureInfo.InvariantCulture, "{0} {1}", this.FirstName, this.LastName);
        }
    }
}
```

Since C# 6.0, the FirstName and LastName properties can be simplified to getter only, and FullName property can be simplified to expression body:

```csharp
public class Person
{
    public Person(string firstName, string lastName)
    {
        this.FirstName = firstName;
        this.LastName = lastName;
    }

    public string FirstName { get; }

    public string LastName { get; }

    public string FullName => $"{this.FirstName} {this.LastName}";
}
```

Please notice expression bodied property is different from auto property with initializer. Consider the following case:

```csharp
public class Person
{
    public Guid Id1 { get; } = Guid.NewGuid();

    public Guid Id2 => Guid.NewGuid();
}
```

Every time when Id1 is called, it always returns the same GUID; Every time when Id2 is called, it always returns a new GUID. Actually, above class is compiled to:

```csharp
public class Person
{
    [CompilerGenerated]
    private readonly Guid id1BackingField = Guid.NewGuid();

    public Guid Id1
    {
        [CompilerGenerated]
        get { return this.id1BackingField; }
    }

    public Guid Id2
    {
        [CompilerGenerated]
        get { return Guid.NewGuid(); }
    }
}
```