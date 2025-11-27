---
title: "C# Coding Guidelines (3) Members"
published: 2009-10-07
description: "C# Coding Guidelines:"
image: ""
tags: [".NET", "C#", "Coding Guidelines"]
category: "C#"
draft: false
lang: ""
---

C# Coding Guidelines:

-   [C# Coding Guidelines (1) Fundamentals](/posts/csharp-coding-guidelines-1-fundamentals)
-   [C# Coding Guidelines (2) Naming](/posts/csharp-coding-guidelines-2-naming)
-   C# Coding Guidelines (3) Members
-   [C# Coding Guidelines (4) Types](/posts/csharp-coding-guidelines-4-types)
-   [C# Coding Guidelines (5) Exceptions](/posts/csharp-coding-guidelines-5-exceptions)
-   [C# Coding Guidelines (6) Documentation](/posts/csharp-coding-guidelines-6-documentation)
-   [C# Coding Guidelines (7) Tools](/posts/csharp-coding-guidelines-7-tools)

## Constructors

**✔** Consider designing lightweight constructors doing minimal work, like initializing the fields with the parameters.

When we call a constructor, an instance is expected to return immediately. These constructors are heavy and could be slow:

```csharp
internal class Category
{
    internal Category(int id)
    {
        this.Items = QueryFromDatabase(item => item.CategoryId == id);
    }
}

internal class Taxonomy
{
    internal Taxonomy(Uri uri)
    {
        this.Value = DownloadFromInternet(uri);
    }
}
```

When the database or network is busy:

```csharp
Category category = new Category(id);
Taxonomy taxonomy = new Taxonomy(uri);
```

In the above thread it would take 5 minutes to create a new instance of the class, which will be surprising. So it is recommended to deign the constructors like this:

```csharp
internal class Category
{
    internal Category(int id)
    {
        this.Id = id;
    }
}

internal class Taxonomy
{
    internal Taxonomy(Uri uri)
    {
        this.Uri = uri;
    }
}
```

Then the data will be retrieved later when the data is needed.

**✔** Consider using constructor to manage dependencies.

This following sample is based on [Stephen Walther](http://stephenwalther.com/)’s [code](http://stephenwalther.com/blog/archive/2009/02/27/chapter-5-understanding-models.aspx):

```csharp
public class ProductController : Controller
{
    public ActionResult Index()
    {
        return this.View(repository.List<Product>().ToList());
    }

    public ActionResult Create(Product productToCreate)
    {
        try
        {
            repository.Create<Product>(productToCreate);
        }
        catch (InvalidOperationException)
        {
            return this.View();
        }

        return this.RedirectToAction("Index");
    }    
}
```

As you see, to implement the functionalities, ProductController class (higher layer code) need to call IRepository interface (lower layer code). So there is a dependency between ProductController class and IRepository interface. We can inject IRepository into ProductController via ProductController’s constructor:

```csharp
public class ProductController : Controller
{
    private IRepository _repository;

    public ProductController(IRepository repository)
    {
        this._repository = repository;
    }

    public ActionResult Index()
    {
        return this.View(this._repository.List<Product>().ToList());
    }

    public ActionResult Create(Product productToCreate)
    {
        try
        {
            this._repository.Create<Product>(productToCreate);
        }
        catch (InvalidOperationException)
        {
            return this.View();
        }

        return this.RedirectToAction("Index");
    }
}
```

For more information of dependency injection pattern, please read [Martin Fowler](http://martinfowler.com/)’s [article](http://martinfowler.com/articles/injection.html).

**✘** Avoid calling virtual members in constructor.

In this base class, virtual method is called:

```csharp
public class Base
{
    protected bool _field;

    public Base()
    {
        this.Method();
    }

    public virtual void Method()
    {
        Console.WriteLine("Method is called.");
    }
}

public class Derived : Base
{
    public Derived()
    {
        this._field = true;
    }

    public override void Method()
    {
        Console.WriteLine("_field is {0}.", this._field);
    }
}

internal class Program
{
    private static void Main()
    {
        Derived derived = new Derived();
    }
}
```

So when we invoke the derived class constructor, its method will be executed before the constructor being executed. This is a unexpected behavior for the designer of the derived class.

## Instance Members vs. static Members

**✔** Consistently use “this.” prefix before to call to instance members.

This is too simple but strongly suggested because it is very helpful to distinguish the invocation of instance members and static members.

A common question is, if “this.” is always added before instance members, it is harder to refactor instance member into static member. The answer is:

-   This is a design issue which should not happen by default;
-   Even it happened, refactor tools can be used to easily deal with that.

Actually, this is also the requirement of Rule SA1101 of StyleCop.

## Properties

**✔** Design a property if it

-   behaves like a field, or is a logical attribute of the type;
-   is unlikely to throw exceptions (If the setter throws an exception, keep the original value.);
-   does not have dependencies on each other;
-   is settable in any order.

Once in a project, there is a static utility class the intermediate layer, its static properties had to be used in a special order. I suggest the developers to correct this design but they did not. After sometime, more properties were added due to the requirement change, then those properties became a nightmare for the developers to work with.

## Methods

**✔** Design a method if

-   the operation is a conversion, such as ToString();
-   the getter has an observable side effect;
-   the order of executions is important;
-   the method might not return immediately;
-   the member returns a collection.

**✘** Do not use property if a different value is returned for each invocation

-   System.DateTime.Now

Obviously the value of Now is not persisted at all. System.Guid.NewGuid() is a correct sample.

Sometimes, designing a GetXxx() method results a warning in Code Analysis: “CA1024: Microsoft.Design: Change 'YourType.GetXxx()' to a property if appropriate.” If the design is appropriate, just suppress this warning.

**✘** For methods returning a collection, when the result collection is empty, do not return null. Return an empty collection instead.

## Extension Methods

**✔** Consider using extension methods to manage dependencies.

This sample is from [this talk](http://channel9.msdn.com/pdc2008/PC58/). Consider we might need a String.ToUri() method to convert a string to a URI:

```csharp
Uri uri = "http://www.CoolWebOS.com".ToUri();
```

It is hard to define a ToUri() method in the String type:

```csharp
namespace System
{
    public class String
    {
        public Uri ToUri()
        {
            return new Uri(this);
        }
    }
}
```

String type is defined in mscorlib.dll assembly, and Uri type is defined in System.dll assembly. The dependency is from System.dll to mscorlib.dll. It is improper to use the Uri type inside the String type.

The solution is extension method:

```csharp
namespace System.Net
{
    public static class StringExtensions
    {
        public static Uri ToUri(this string uriString)
        {
            return new Uri(uriString);
        }
    }
}
```

And of course it should be defined in the higher-level code, not in the mscorlib.dll.