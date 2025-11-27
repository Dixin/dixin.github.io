---
title: "Understanding C# Features (2) Object Initializer, Collection Initializer and Index Initializer"
published: 2009-11-26
description: "\\] - \\]"
image: ""
tags: [".NET", "C#", "C# 3.0", "C# Features", "LINQ", "LINQ via C#"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C#](/posts/linq-via-csharp)\] - \[[C# Features](/archive/?tag=C%23%20Features)\]

Take this Person type as an example:

```csharp
public class Person
{
    public string Name { get; set; }

    public int Age { get; set; }
}
```

## Object initializer

Before C# 3.0, a Person object can be initialized like this:

```csharp
Person person = new Person();
person.Name = "Dixin";
person.Age = 30;
```

With object initializer syntactic sugar in C# 3.0+, above code can be more declarative:

```csharp
Person person = new Person()
    {
        Name = "Dixin",
        Age = 30
    };
```

which is will be compiled to above imperative version..

## Collection initializer

Similarly, before C# 3.0, a collection can be initialized like this:

```csharp
Collection<Person> persons = new Collection<Person>();
persons.Add(anna);
persons.Add(brian);
```

In C# 3.0+, there is syntactic sugar called collection initializer:

```csharp
Collection<Person> persons = new Collection<Person>()
    {
        anna, 
        brian
    };
```

The compiler will look up the Add() method, and compile collection initializer to above imperative code.

To use the collection initializer, a collection must:

-   Implement System.IEnumerable
-   Has a Add() instance method or extension method; It takes at least one parameter, and its return value is ignored

The following example demonstrates the minimal requirement of collection initializer:

```csharp
public class PersonCollection : IEnumerable
{
    public void Add(Person person)
    {
    }

    public IEnumerator GetEnumerator()
    {
        throw new NotImplementedException();
    }
}
```

If the Add() method takes more than one parameters, this syntax should be used:

```csharp
Dictionary<string, int> persons = new Dictionary<string, int>()
    {
        { "Anna", 18 }, // Compiled to persons.Add("Mark", 18).
        { "Brian", 19 } // Compiled to persons.Add("Steven", 18).
    };
```

## Index initializer

Since C# 6.0, index initializer syntactic sugar makes C# indexer declarative too:

```csharp
PersonDictionary persons = new PersonDictionary()
    {
        [Guid.NewGuid()] = new Person() { Name = "Dixin", Age = 30 }
    };
```

And this is the minimal requirement of index initializer:

```csharp
public class PersonDictionary
{
    public Person this[Guid id]
    {
        set { throw new NotImplementedException(); }
    }
}
```