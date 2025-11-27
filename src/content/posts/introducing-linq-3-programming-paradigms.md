---
title: "Introducing LINQ (3) Programming Paradigms"
published: 2010-03-02
description: "\\] - \\]"
image: ""
tags: [".NET", "C#", "Functional Programming", "Haskell", "JavaScript", "LINQ", "Ruby", "TSQL"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C#](/posts/linq-via-csharp)\] - \[[Introducing LINQ](/archive/?tag=Introducing%20LINQ)\]

Programming paradigm is the fundamental style of programming.

## Imperative vs. declarative

### LINQ

This is the fore mentioned example of collection processing:

```typescript
public partial class Imperative
{
    public static List<Person> FilterAndOrderByAge(IEnumerable<Person> source)
    {
        List<Person> results = new List<Person>();
        foreach (Person person in source)
        {
            if (person.Age >= 18)
            {
                results.Add(person);
            }
        }

        Comparison<Person> personComparison = delegate(Person a, Person b)
            {
                int ageComparison = 0 - a.Age.CompareTo(b.Age);
                return ageComparison != 0
                    ? ageComparison
                    : string.Compare(a.Name, b.Name, StringComparison.Ordinal);
            };
        results.Sort(personComparison);

        return results;
    }
}
```

and the same processing with LINQ:
```
public partial class LinqToObjects
{
    public static IEnumerable<Person> FilterAndOrderByAge(IEnumerable<Person> source)
    {
        return from person in source
               where person.Age >= 18
               orderby person.Age descending, person.Name
               select person;
    }
}
```

Their styles/paradigms are very different:

-   The first method has a [imperative style/paradigm](https://en.wikipedia.org/wiki/Imperative_programming): it focuses on how to implement the query by providing the explicit steps of the algorithm.
-   The second method has [declarative style/paradigm](https://en.wikipedia.org/wiki/Declarative_programming): it declares what is the query, like "orderby person.Age descending". It is abstract. It does not provide the steps of the [sorting algorithm](https://en.wikipedia.org/wiki/Sorting_algorithm).

Imperative and declarative programming paradigms are different philosophies:

-   Imperative paradigm is about thinking from bottom up. It explicitly provides each action to be taken, and a sequence of action can be a “bigger” action, and so on. Computation is to execute these actions.
    -   Object oriented programming of C# is a typical imperative paradigm.
-   Declarative paradigm is about thinking from top down. It is higher level, more abstract, has clear correspondence to mathematical logic, where can be considered as theories of a formal logic, and computations can be considered as deductions in that logic space. As a higher level and more abstract paradigm, it usually minimize or eliminate [side effects](https://en.wikipedia.org/wiki/Side_effect_\(computer_science\)).
    -   [Functional programming](https://en.wikipedia.org/wiki/Functional_programming) is a typical declarative paradigm, and it is the major topic of LINQ.

### SQL

As fore mentioned, LINQ is SQL-like. The following SQL query is very declarative:

```sql
SELECT [ProductName], [UnitPrice] FROM [Products] ORDER BY [UnitPrice] DESC
```

### XAML

Another declarative example is XAML. Compare C#:
```
Button button = new Button();
button.Content = "Submit";
button.HorizontalAlignment = HorizontalAlignment.Left;
button.VerticalAlignment = VerticalAlignment.Top;
button.Margin = new Thickness(10, 10, 0, 0);
button.Width = 75;
button.Click += this.Submit;
```

with the following XAML:
```
<Button Content="Submit" HorizontalAlignment="Left" VerticalAlignment="Top" Margin="10,10,0,0" Width="75" Click="Submit" />
```

Above C# is imperative and above XAML is declarative.

### HTML

Another controversial topic is HTML. In [CLR via C# 2nd edition](http://www.amazon.com/CLR-Via-C-Pro-Developer/dp/0735621632), [Jeffrey Richter](http://en.wikipedia.org/wiki/Jeffrey_Richter) said (This paragraph is removed in the [3rd edition](http://www.amazon.com/CLR-via-Pro-Developer-Jeffrey-Richter/dp/0735627045)),

> An example of declarative programming is when a person creates a text file and explicitly enters HTML tags into the file by using an editor such as Notepad.exe. In this scenario, the HTML tags act as instructions that are eventually processed by the Internet browser so that it can lay out the page in a window. The HTML tags are declaring how the program (Web page) should be displayed and operate, and it's the programmer who decides what tags to use and where. Many hard-core programmers don't consider HTML programming to be real programming, but I do.

Similar to C# vs. XAML, if comparing with [JavaScript](http://en.wikipedia.org/wiki/JavaScript):
```
var img = document.CreateElement("img");
img.src = "https://farm3.staticflickr.com/2875/9215169916_f8fa57c3da_b.jpg";
img.style.width = "300px";
img.style.height = "200px";
img.title = "Microsoft Way";
```

with HTML:
```
<img src="https://farm3.staticflickr.com/2875/9215169916_f8fa57c3da_b.jpg" style="width: 300px; height: 200px;" title="Microsoft Way" />
```

then HTML is the declarative.

## Programming paradigms and languages

Imperative, declarative, object-oriented, functional, ... There are [many paradigms for programming](https://en.wikipedia.org/wiki/Programming_paradigm). The common paradigms can be categorized as:

-   [Declarative programming](https://en.wikipedia.org/wiki/Declarative_programming)
    -   [Dataflow programming](https://en.wikipedia.org/wiki/Dataflow_programming)
        -   [Reactive programming](https://en.wikipedia.org/wiki/Reactive_programming)
    -   [Functional programming](https://en.wikipedia.org/wiki/Functional_programming)
-   [Event-driven programming](https://en.wikipedia.org/wiki/Event-driven_programming)
-   [Generic programming](https://en.wikipedia.org/wiki/Generic_programming)
-   [Imperative programming](https://en.wikipedia.org/wiki/Imperative_programming)
    -   [Object-oriented programming](https://en.wikipedia.org/wiki/Object-oriented_programming)
        -   [Class-based programming](https://en.wikipedia.org/wiki/Class-based_programming)
        -   [Prototype-based programming](https://en.wikipedia.org/wiki/Prototype-based_programming)
    -   [Procedural programming](https://en.wikipedia.org/wiki/Procedural_programming)
-   [Metaprogramming](https://en.wikipedia.org/wiki/Metaprogramming)
    -   [Reflective programming](https://en.wikipedia.org/wiki/Reflection_\(computer_programming\))
        -   [Attribute-oriented programming](https://en.wikipedia.org/wiki/Attribute-oriented_programming)
-   [Parallel programming](https://en.wikipedia.org/wiki/Parallel_computing)
-   [Structured programming](https://en.wikipedia.org/wiki/Structured_programming)
    -   [Aspect-oriented programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming)
-   ...

One programming language can adopt several paradigms. Take C as an example:

-   C is typically used as procedural;
-   It can also [be used in object-oriented programming](http://www.planetpdf.com/codecuts/pdfs/ooc.pdf).

Another example is JavaScript:

-   JavaScript is imperative by default, it is
    -   Procedural
    -   Prototype-based
-   It is also [elegantly functional](http://www.ibm.com/developerworks/web/library/wa-javascript.html?S_TACT=105AGX52&S_CMP=cn-a-web)

And finally, C# is:

-   Declarative (attribute, regular expression, data annotation, code contracts, …)
    -   Reactive ([Rx](http://msdn.microsoft.com/en-us/devlabs/ee794896.aspx))
    -   Functional (lambda expression, higher-order function, LINQ, …)
-   Event-driven (event)
-   Generic
-   Imperative (by default)
    -   Class-based Object-oriented (class)
    -   Procedural (static class, static method, using static)
-   Metaprogramming (code DOM, expression tree, IL emit, compiler as a service)
    -   Reflective (reflection)
-   Parallel (TPL, Parallel LINQ)
-   Structured
    -   Aspect-oriented ([Unity](https://msdn.microsoft.com/en-us/magazine/gg490353.aspx))

Thanks to Microsoft and [Anders Hejlsberg](http://en.wikipedia.org/wiki/Anders_Hejlsberg), C#/.NET is powerful and productive, work in many different scenarios.

## Declarative C#

C# 3.0+ introduced a lot of syntax to make it more declarative. For example, the object initializer collection initializer:
```
List<Person> team = new List<Person>();
Person anna = new Person();
anna.Age = 25;
anna.Name = "Anna";
team.Add(anna);
Person bob = new Person();
bob.Age = 30;
bob.Name = "Bob";
team.Add(bob);
Person charlie = new Person();
charlie.Age = 35;
charlie.Name = "Charlie";
team.Add(charlie);
Person dixin = new Person();
dixin.Age = 30;
dixin.Name = "Dixin";
team.Add(charlie);
```

Comparing to:
```
List<Person> team = new List<Person>
    {
        new Person() { Age = 25, Name = "Anna" }, 
        new Person() { Age = 30, Name = "Bob" }, 
        new Person() { Age = 35, Name = "Charlie" }, 
        new Person() { Age = 30, Name = "Dixin" }, 
    };
```

the first code snippet is more imperative, and the second is more declarative. Actually, there are many other declarative aspects in C# programming.

### Attribute

Actually, declarative programming in C# is not something brand new. C# has attributes from the beginning:

```csharp
[HandleError]
public class HomeController : Controller
{
    [HttpGet]
    public ActionResult Index()
    {
        return this.View();
    }
}
```

### Regular expression

Regular expressions can be considered declarative:

```csharp
namespace System.ComponentModel.DataAnnotations
{
    using System.Text.RegularExpressions;

    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
    public sealed class EmailAddressAttribute : DataTypeAttribute
    {
        private static readonly Regex emailRegex = new Regex(
            "^((([a-z]|\\d|[!#\\$%&'\\*\\+\\-\\/=\\?\\^_`{\\|}~]|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])+(\\.([a-z]|\\d|[!#\\$%&'\\*\\+\\-\\/=\\?\\^_`{\\|}~]|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])+)*)|((\\x22)((((\\x20|\\x09)*(\\x0d\\x0a))?(\\x20|\\x09)+)?(([\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x7f]|\\x21|[\\x23-\\x5b]|[\\x5d-\\x7e]|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])|(\\\\([\\x01-\\x09\\x0b\\x0c\\x0d-\\x7f]|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]))))*(((\\x20|\\x09)*(\\x0d\\x0a))?(\\x20|\\x09)+)?(\\x22)))@((([a-z]|\\d|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])|(([a-z]|\\d|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])([a-z]|\\d|-|\\.|_|~|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])*([a-z]|\\d|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])))\\.)+(([a-z]|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])|(([a-z]|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])([a-z]|\\d|-|\\.|_|~|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])*([a-z]|[\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF])))\\.?$",
            RegexOptions.IgnoreCase | RegexOptions.ExplicitCapture | RegexOptions.Compiled);

        public EmailAddressAttribute()
            : base(DataType.EmailAddress)
        {
            this.ErrorMessage = DataAnnotationsResources.EmailAddressAttribute_Invalid;
        }

        public override bool IsValid(object value)
        {
            if (value == null)
            {
                return true;
            }

            string text = value as string;
            return text != null && emailRegex.Match(text).Length > 0;
        }
    }
}
```

### Data annotation

Data Annotation is intuitively declarative:

```csharp
public class Person
{
    [Required(ErrorMessageResourceType = typeof(Resources), ErrorMessageResourceName = nameof(Resources.NameRequired))]
    [StringLength(1, ErrorMessageResourceType = typeof(Resources), ErrorMessageResourceName = nameof(Resources.InvalidName))]
    public string Name { get; set; }

    [Required(ErrorMessageResourceType = typeof(Resources), ErrorMessageResourceName = nameof(Resources.AgeRequired))]
    [Range(0, 123, ErrorMessageResourceType = typeof(Resources), ErrorMessageResourceName = nameof(Resources.InvalidAge))] // https://en.wikipedia.org/wiki/Oldest_people
    public int Age { get; set; }

    [EmailAddress(ErrorMessageResourceType = typeof(Resources), ErrorMessageResourceName = nameof(Resources.InvalidEmail))]
    public string Email { get; set; }
}
```

### Code contracts

C# 3.0 and 4.0 introduced [code contracts](http://msdn.microsoft.com/en-us/devlabs/dd491992.aspx), which is also declarative:

```csharp
public class Person
{
    private readonly string name;

    private readonly int age;

    public Person(string name, int age)
    {
        Contract.Requires<ArgumentNullException>(!string.IsNullOrWhiteSpace(name));
        Contract.Requires<ArgumentOutOfRangeException>(age >= 0);

        this.name = name;
        this.age = age;
    }

    public string Name
    {
        [Pure]
        get
        {
            Contract.Ensures(!string.IsNullOrWhiteSpace(Contract.Result<string>()));

            return this.name;
        }
    }

    public int Age
    {
        [Pure]
        get
        {
            Contract.Ensures(Contract.Result<int>() >= 0);

            return this.age;
        }
    }
}
```

### LINQ and Functional C#

Above LinqToObjects.FilterAndOrderByAge method implementation is equivalent to (actually is compiled to):
```
public partial class LinqToObjects
{
    public static IEnumerable<Person> FilterAndOrderByAge(IEnumerable<Person> source)
    {
        return source
            .Where(person => person.Age >= 18)
            .OrderByDescending(person => person.Age)
            .ThenBy(person => person.Name);
    }
}
```

This LINQ to Objects program is functional, and purely functional:

-   Type inference
-   Extension method
-   Lambda expression as anonymous function
-   Higher order function
-   Query expression/Query method

Since C# 3.0, more and more language features has been added to C#, which make C# more and more functional. Besides above features, there are more:

-   Auto property, auto property initializer, getter only auto property
-   Object initializer, collection initializer, index initializer, extension Add in collection initializers
-   Anonymous type
-   Partial class, partial interface, partial method
-   Lambda expression as expression tree, expression-bodied members
-   Async lambda expression
-   Covariance and contravariance

Next, these language features will be explained in detail.