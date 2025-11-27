---
title: "Understanding LINQ to Objects (8) The Design Of IEnumerable<T>"
published: 2010-03-20
description: "\\]"
image: ""
tags: [".NET", "C#", "LINQ", "LINQ to Objects", "LINQ via C# Series", "Usability"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C# series](/posts/linq-via-csharp)\]

Currently in .NET, iterator pattern is implemented via IEnumerable<T> and IEnumerator<T> (or IEnumerable and IEnumerator):

```csharp
namespace System.Collections
{
    // Represents a collection which can be iterated.
    public interface IEnumerable
    {
        IEnumerator GetEnumerator();
    }

    // Represents an iterator which is used to iterate that collection.
    public interface IEnumerator
    {
        object Current { get; }

        bool MoveNext();

        void Reset();
    }
}

namespace System.Collections.Generic
{
    // T is covariant.
    public interface IEnumerable<out T> : IEnumerable
    {
        IEnumerator<T> GetEnumerator();
    }

    // T is covariant.
    public interface IEnumerator<out T> : IDisposable, IEnumerator
    {
        T Current { get; }
    }
}
```

The meaning of out keyword is explained in another post [Understanding C# Covariance And Contravariance (2) Interfaces](/posts/understanding-csharp-covariance-and-contravariance-2-interfaces).[](http://11011.net/software/vspaste)

For years I have different ideas on the design:

-   The first problem is, why they are called enumerable and enumerator? Iteratable and iterator sounds natural enough;
-   The second problem is, why IEnumerable IEnumerable<T> have Current properties? According to [Framework Design Guidelines](http://www.amazon.com/Framework-Design-Guidelines-Conventions-Libraries/dp/0321545613), they should be designed as methods, because they returns different values for each invocation (similar with Guid.NewGuid()).

In my opinion, the following design should be more perfect:

```csharp
namespace System.Collections
{
    public interface IIteratable
    {
        IIterator GetEnumerator();
    }

    public interface IIterator
    {
        object GetCurrent();

        bool MoveNext();

        void Reset();
    }
}

namespace System.Collections.Generic
{
    public interface IIteratable<out T> : IIteratable
    {
        IIterator<T> GetEnumerator();
    }

    public interface IIterator<out T> : IDisposable, IIterator
    {
        T GetCurrent();
    }
}
```