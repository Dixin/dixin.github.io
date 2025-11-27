---
title: "Functional Programming and LINQ Paradigm (3) Programming Paradigms and Functional Programming"
published: 2018-05-30
description: "Programming paradigm is the fundamental style of programming. There are , for example:"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## Latest version: [https://weblogs.asp.net/dixin/introducing-linq-3-what-is-functional-programming](/posts/introducing-linq-3-what-is-functional-programming)

Programming paradigm is the fundamental style of programming. There are [many paradigms for programming](https://en.wikipedia.org/wiki/Programming_paradigm), for example:

-   [Declarative programming:](https://en.wikipedia.org/wiki/Declarative_programming) designs what is the logic of operations, without describing its control flow (SQL, etc.)

-   [Functional programming](https://en.wikipedia.org/wiki/Functional_programming): uses expressions to describe operations, which are treated as call of functions (Lisp, etc.)

-   [Purely functional programming](https://en.wikipedia.org/wiki/Purely_functional_programming): does not rely on mutable state (Haskell, etc.)

-   [Logic programming](https://en.wikipedia.org/wiki/Logic_programming): designs the program with facts and rules in logical form (Prolog, etc.)

-   [Dynamic programming](https://en.wikipedia.org/wiki/Dynamic_programming_language): executes compile time behaviors at runtime (PHP, etc.)
-   [Event-driven programming](https://en.wikipedia.org/wiki/Event-driven_programming): drives the operations with events (JavaScript, etc.)
-   [Generic programming](https://en.wikipedia.org/wiki/Generic_programming): supports type parameters for data structures and operations (Swift, etc.)
-   [Imperative programming:](https://en.wikipedia.org/wiki/Imperative_programming) uses commands/statements to specify how the program operates (Assembly language, etc.)

-   [Object-oriented programming:](https://en.wikipedia.org/wiki/Object-oriented_programming) designs the program in objects, containing data in the form of fields, and behaviors in the forms of methods
    -   [Class-based programming](https://en.wikipedia.org/wiki/Class-based_programming): defines the data structure and behaviors as classes, and implements inheritance for classes (C++, etc.)
    -   [Prototype-based programming](https://en.wikipedia.org/wiki/Prototype-based_programming): implements classless prototypal inheritance and behavior reuse (Self, etc.)
-   [Procedural programming](https://en.wikipedia.org/wiki/Procedural_programming): designs program in procedures and sub-procedures (C, etc.)

-   [Metaprogramming](https://en.wikipedia.org/wiki/Metaprogramming): accesses program code as data (Ruby, etc.)

-   [Reflective programming](https://en.wikipedia.org/wiki/Reflection_\(computer_programming\)): accesses the structure and behavior of the program itself at runtime (Ruby, etc.)

etc.

One programming language can adopt multiple paradigms. For example: C# supports many paradigms:

-   declarative programming: attributes, data annotations, code contracts, etc.

-   functional programming: first class functions, lambda expressions, LINQ query expressions, etc.

-   dynamic programming: the dynamic type
-   event-driven programming: events, event handlers
-   generic programming: generics
-   imperative programming: statements, control flows.
    -   object-oriented and class-based programming: classes, encapsulation, inheritance, polymorphism, etc.
    -   procedural programming: static class, static method, using static, etc.
-   metaprogramming: code DOM, expression tree, CIL emit, compiler as a service, etc.

-   reflective programming: reflection

C# is such a powerful, flexible and productive language for general purpose, and all these C# language features live in in harmony. This tutorial discusses functional programming of C#, but other features, like generics, objects, attributes, expression trees, etc., is used a lot in functional C# code.

## Imperative programming vs. declarative programming

Functional programming is declarative, and describes what to do; Object-oriented programming is imperative, and specifies how to do. To compare these 2 paradigms. The following examples query the delegate types in the .NET core library (mscorlib.dll of .NET Framework, System.Private.CoreLib.dll of .NET Core). The task is:

-   filter the types to get delegate types
-   group the delegate types by their namespaces
-   sort the groups by each group’s delegate type count in descending order, and if groups have identical delegate type count, then sort them by their namespaces

The following query is implemented this with traditional C# object-oriented programming. It is imperative. The code is a sequence of statements and commands, specifying how to execute the query:

```csharp
internal static void DelegateTypes()
{
    Assembly coreLibrary = typeof(object).Assembly;
    Dictionary<string, List<Type>> delegateTypes = new Dictionary<string, List<Type>>();
    foreach (Type type in coreLibrary.GetExportedTypes())
    {
        if (type.BaseType == typeof(MulticastDelegate))
        {
            if (!delegateTypes.TryGetValue(type.Namespace, out List<Type> namespaceTypes))
            {
                namespaceTypes = delegateTypes[type.Namespace] = new List<Type>();
            }
            namespaceTypes.Add(type);
        }
    }
    List<KeyValuePair<string, List<Type>>> delegateTypesList =
        new List<KeyValuePair<string, List<Type>>>(delegateTypes);
    for (int index = 0; index < delegateTypesList.Count - 1; index++)
    {
        int currentIndex = index;
        KeyValuePair<string, List<Type>> after = delegateTypesList[index + 1];
        while (currentIndex >= 0)
        {
            KeyValuePair<string, List<Type>> before = delegateTypesList[currentIndex];
            int compare = before.Value.Count.CompareTo(after.Value.Count);
            if (compare == 0)
            {
                compare = string.Compare(after.Key, before.Key, StringComparison.Ordinal);
            }
            if (compare >= 0)
            {
                break;
            }
            delegateTypesList[currentIndex + 1] = delegateTypesList[currentIndex];
            currentIndex--;
        }
        delegateTypesList[currentIndex + 1] = after;
    }
    foreach (KeyValuePair<string, List<Type>> namespaceTypes in delegateTypesList) // Output.
    {
        Trace.Write(namespaceTypes.Value.Count + " " + namespaceTypes.Key + ":");
        foreach (Type delegateType in namespaceTypes.Value)
        {
            Trace.Write(" " + delegateType.Name);
        }
        Trace.WriteLine(null);
    }
    // 30 System: Action`1 Action Action`2 Action`3 Action`4 Func`1 Func`2 Func`3 Func`4 Func`5 Action`5 Action`6 Action`7 Action`8 Func`6 Func`7 Func`8 Func`9 Comparison`1 Converter`2 Predicate`1 ResolveEventHandler AssemblyLoadEventHandler AppDomainInitializer CrossAppDomainDelegate AsyncCallback ConsoleCancelEventHandler EventHandler EventHandler`1 UnhandledExceptionEventHandler
    // 8 System.Threading: SendOrPostCallback ContextCallback ParameterizedThreadStart WaitCallback WaitOrTimerCallback IOCompletionCallback ThreadStart TimerCallback
    // 3 System.Reflection: ModuleResolveEventHandler MemberFilter TypeFilter
    // 3 System.Runtime.CompilerServices: TryCode CleanupCode CreateValueCallback
    // 2 System.Runtime.Remoting.Messaging: MessageSurrogateFilter HeaderHandler
    // 1 System.Runtime.InteropServices: ObjectCreationDelegate
    // 1 System.Runtime.Remoting.Contexts: CrossContextDelegate
}
```

The following example is functional LINQ implementation, it is declarative. The code describes the logic, without specifying the execution details:

```csharp
internal static partial class Linq
{
    internal static void DelegateTypesQueryExpression()
    {
        Assembly coreLibrary = typeof(object).Assembly;
        IEnumerable<IGrouping<string, Type>> delegateTypes =
            from type in coreLibrary.GetExportedTypes()
            where type.BaseType == typeof(MulticastDelegate)
            group type by type.Namespace into namespaceTypes
            orderby namespaceTypes.Count() descending, namespaceTypes.Key
            select namespaceTypes;
        foreach (IGrouping<string, Type> namespaceTypes in delegateTypes) // Output.
        {
            Trace.Write(namespaceTypes.Count() + " " + namespaceTypes.Key + ":");
            foreach (Type delegateType in namespaceTypes)
            {
                Trace.Write(" " + delegateType.Name);
            }
            Trace.WriteLine(null);
        }
    }
}
```

The following is the identical query in query method syntax:

```csharp
internal static partial class Linq
{
    internal static void DelegateTypesQueryMethods()
    {
        Assembly coreLibrary = typeof(object).Assembly;
        IEnumerable<IGrouping<string, Type>> delegateTypes = coreLibrary.GetExportedTypes()
            .Where(type => type.BaseType == typeof(MulticastDelegate))
            .GroupBy(type => type.Namespace)
            .OrderByDescending(namespaceTypes => namespaceTypes.Count())
            .ThenBy(namespaceTypes => namespaceTypes.Key);
        foreach (IGrouping<string, Type> namespaceTypes in delegateTypes) // Output.
        {
            Trace.Write(namespaceTypes.Count() + " " + namespaceTypes.Key + ":");
            foreach (Type delegateType in namespaceTypes)
            {
                Trace.Write(" " + delegateType.Name);
            }
            Trace.WriteLine(null);
        }
    }
}
```

So imperative programming and declarative programming are quite different paradigms and approaches. Imperative programming has a history to think from lower level up. The computer hardware’s implementation usually is imperative and stateful, so machine code is designed to be imperative and change hardware states during the execution. Then low level programming languages are designed, which usually have strong correspondence to the machine code with a little or no abstractions, so they are also imperative and stateful, like assembly language. Later, higher level programming languages are designed as abstraction of low level languages, which is usually more portable, but still imperative and stateful. For example, C is the abstractions of assembly languages, C++ was initially called C with Classes and designed as extension of C. When Microsoft designed modern languages, C# is rooted in C family of languages to make immediately familiar to programmers of C, C++, and Java, etc., so C# can be imperative and stateful too - Actually C# was initially called COOL (C-like Object Oriented Language). In above imperative example, all execution details of logic have to be specified.

-   how to filter: scan the types, if a type is not a delegate type, ignore it.
-   how to group: use a dictionary to store the groups, where each dictionary key is namespace, and each dictionary value is a list of delegate types under a namespace; for each delegate type, if the dictionary does not have the delegate type’s namespace as a key yet, add a key-value pair to the dictionary, where key is the namespace, and value is an empty list of types; now the current namespace must have a corresponding type list, so add the delegate type to the type list.
-   and how to sort: copy the groups (key-value pairs of dictionary) to a list, so that the groups have an order. then scan the list of groups to apply insertion sort; when comparing 2 groups, first comparing their delegate type counts, if they have the same count, then compare their namespaces; after growing the sorted sub list of groups, eventually all groups are sorted in place.

The above sequence of statements and commands is a control flow, where the business logic is less intuitive.

In contrast, declarative programming is to think from higher level. It is usually abstractions of the mathematics and logic, disregarding how exactly the operations should be executed. This usually includes avoiding specifying how to change state and how to mutate data. In above LINQ examples, the query simply declares:

-   what is the filter logic: keep delegate types
-   what is the group logic: group delegate types by namespaces
-   what is the sorting logic: sort the delegate type groups in descending order of delegate type counts, then in ascending order of namespaces

The above is an data flow, where the business logic is more intuitive.

The previous part demonstrated the traditional XML data and SQL database queries in imperative, object-oriented paradigm. They specify how exactly to access the specific data sources, like opening SQL database connection, etc., pass the query logic to data source with domain specific SQL and XPath languages, etc. In contrast, the LINQ to XML and LINQ to Entities queries are functional and declarative, they describe the query logic without specifying execution details.

Regarding computer hardware is usually imperative, declarative code eventually needs to translated to imperative code to execute in hardware. This process is usually done by compilers at compile time, and also API calls at runtime, so that at design time, the code can be declarative and functional. Later, this tutorial will discuss how functional and declarative LINQ is implemented by C# compiler and the LINQ query APIs’ internals.

Besides LINQ and functional programming, C#/.NET also provide other declarative features and APIs. For example, attribute is a powerful feature to associate declarative information with code, including assemblies, modules, types, type members:

```csharp
[TestClass]
public class QueryMethodsTests
{
    [TestMethod]
    public void FilteringTest()
    {
        // Unit test.
    }

    [TestMethod]
    public void GroupingTest()
    {
        // Unit test.
    }
}
```

Attributes are widely used in C#/.NET programming. For example, data annotation is a technology to use attributes to modeling, display, and validate data entities. The following type uses attributes to declare validation rules for its properties, and the error messages when the validation fails:

```csharp
public class Contact
{
    [Required(ErrorMessageResourceType = typeof(Resources), ErrorMessageResourceName = nameof(Resources.NameRequired))]
    [StringLength(maximumLength: 50, MinimumLength = 1, ErrorMessageResourceType = typeof(Resources), ErrorMessageResourceName = nameof(Resources.NameInvalid))]
    public string Name { get; set; }

    [EmailAddress(ErrorMessageResourceType = typeof(Resources), ErrorMessageResourceName = nameof(Resources.EmailInvalid))]
    public string Email { get; set; }
}
```

Code contracts is also a declarative technology to describes the behavior of code. The following example describes type members’ precondition, postcondition, and purity, which is intuitive and readable:

```csharp
public class Product
{
    private readonly string name;

    private readonly decimal price;

    public Product(string name, decimal price)
    {
        Contract.Requires<ArgumentNullException>(!string.IsNullOrWhiteSpace(name));
        Contract.Requires<ArgumentOutOfRangeException>(price >= 0);

        this.name = name;
        this.price = price;
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

    public decimal Price
    {
        [Pure]
        get
        {
            Contract.Ensures(Contract.Result<int>() >= 0);

            return this.price;
        }
    }
}
```

## Object-oriented programming vs. functional programming

Object-oriented programming has first class objects., while in functional programming treats functions are first class citizen. To demonstrate the difference, the following example builds a document in object-oriented paradigm. It downloads HTML content from the specified URI, converts it to a word document file, and upload to OneDrive to share:

```csharp
internal class WebClient
{
    internal FileInfo Download(Uri uri)
    {
        return default;
    }
}

internal class DocumentConverter
{
    internal DocumentConverter(FileInfo template)
    {
        this.Template = template;
    }

    internal FileInfo Template { get; private set; }

    internal FileInfo ToWord(FileInfo htmlDocument)
    {
        return default;
    }
}

internal class OneDriveClient
{
    internal void Upload(FileInfo file) { }
}

internal class DocumentBuilder
{
    private readonly WebClient webClient;

    private readonly DocumentConverter documentConverter;

    private readonly OneDriveClient oneDriveClient;

    internal DocumentBuilder(
        WebClient webClient, DocumentConverter documentConverter, OneDriveClient oneDriveClient)
    {
        this.webClient = webClient;
        this.documentConverter = documentConverter;
        this.oneDriveClient = oneDriveClient;
    }

    internal void Build(Uri uri)
    {
        FileInfo htmlDocument = this.webClient.Download(uri);
        FileInfo wordDocument = this.documentConverter.ToWord(htmlDocument);
        this.oneDriveClient.Upload(wordDocument);
    }
}
```

The above WebClient class provides the operation to download HTML content to a document. DocumentConverter class provides the operation to convert HTML document to Word document, with a specified template. And OneDriveClient class provides the operation to upload file to OneDrive. To focus on the paradigm, the implementations are omitted (If interested, the complete web content to Word document building implementation can be found [here](/posts/convert-html-to-well-formatted-microsoft-word-document)). To build the document, DocumentBuilder class is defined to compose everything together. The following code demonstrates how these objects works:

```csharp
internal partial class Imperative
{
    internal static void BuildDocument(Uri uri, FileInfo template)
    {
        DocumentBuilder builder = new DocumentBuilder(
            new WebClient(), new DocumentConverter(template), new OneDriveClient());
        builder.Build(uri);
    }
}
```

In functional paradigm, each operation can be simply represented by a functions, and functions can be composed:

```csharp
internal static partial class Functional
{
    internal static FileInfo DownloadHtml(Uri uri)
    {
        return default;
    }

    internal static FileInfo ConvertToWord(FileInfo htmlDocument, FileInfo template)
    {
        return default;
    }

    internal static void UploadToOneDrive(FileInfo file) { }

    internal static Action<Uri, FileInfo> CreateDocumentBuilder(
        Func<Uri, FileInfo> download, Func<FileInfo, FileInfo, FileInfo> convert, Action<FileInfo> upload)
    {
        return (uri, wordTemplate) =>
        {
            FileInfo htmlDocument = download(uri);
            FileInfo wordDocument = convert(htmlDocument, wordTemplate);
            upload(wordDocument);
        };
    }
}
```

This is how these functions work:

```csharp
internal static partial class Functional
{
    internal static void BuildDocument(Uri uri, FileInfo template)
    {
        Action<Uri, FileInfo> buildDocument = CreateDocumentBuilder(
            DownloadHtml, ConvertToWord, UploadToOneDrive);
        buildDocument(uri, template);
    }
}
```

Here CreateDocumentBuilder function is called with DownloadHtml, ConvertToWord, and UploadToOneDrive functions as arguments, and its return value is a buildDocument function. These function variables work just like object variables. For example, buildDocument is of type Action<Uri, FileInfo>, which means accepting a Uri parameter, and returning void. This demonstrates in C# functions are first class citizens just like objects. Internally, CreateDocumentBuilder function composes the input functions and return a new function.

The above LINQ query example is also an example of function composition. The entire query is composed by Where, GroupBy, OrderBy, and ThenBy.

In object oriented programming, objects can have behaviors in the form of methods, comparing to functions in functional programming, they are both modularized, reusable code block, they can both be called, and they can both have parameters and return values. The main difference is, functional programming is a subtype of declarative programming. Besides declarative, functional programming encourages modeling operations as pure functions. A pure function can be viewed as a mathematical relation between a set of inputs and a set of outputs, and each certain input is related to a certain output. In another word, a pure function’s output only depends on the input. It is also self contained and does not produce side effects, like data mutation, state changes, data mutation, I/O, etc.

In the above object-oriented example of delegate type query introduces a lot of variable mutations, also the dictionary object changes its state for grouping, and the list object changes its state for sorting. In contrast, the LINQ query examples do not involve mutation and state changes at all, and all the involved functions are pure functions:

-   Where’s argument type => type.BaseType == typeof(MulticastDelegate) is a pure function, which accepts Type instance as input (left side of the => operator), and relates to a new bool value as output (right side of the => operator). It predicts whether the input type represents a delegate type. This syntax is called lambda expression, which will be discussed in details later. The output bool value only depends on the input type. And this function does not change states. When it is called with the the same Type object for multiple times, it produces the same bool value.
-   GroupBy’s argument type => type.Namespace is a pure function too, which accepts Type instance as input, and relates to namespace string value as output, which is used as the grouping key. Again, the output namespace string value only depends on the input type. And this function does not change states. When it is called with the same Type object for multiple times, it produces the sane namespace string.
-   OrderByDescending’s argument namespaceTypes => namespaceTypes.Count() is also a pure function, which accepts a group of Type instances as input, and relates to that group’s object count integer value as output, which is used as the sorting key. Again, the output object count integer value only depends on the input group. And this function does not change states. When it function is called with the same group for multiple times, it produces the sane count integer.
-   Similarly, ThenBy’s parameter namespaceTypes => namespaceTypes.Key is still a pure function.
-   Where, GroupBy, OrderByDescending, ThenBy are called LINQ query methods, and they are also pure functions. When they are called, they do not actually execute the filtering, grouping, and sorting logic. They have a source sequence and a function as input, and relate to a new generator object as output, which wraps the input source sequence and input function. They do not change state either. If each of these query methods is called with the same source sequence and function, it produces the same generator. This will be discussed later in detail.

So function programming paradigm treats functions as first class citizen, encourages and self-contained functions focusing on input and output, and also encourages purity and avoids mutation and state changes. Functional programming is declarative and expressive, so it can be easy to read, maintain, parallelize, and test, etc.

Many C# functional programming features, like lambda expression, local function, pattern matching, etc., are introduced to C# since 3.0 and later, but the functional paradigm and concepts has a long history.

-   Lambda expression and functional programming came from lambda calculus, which was invented in 1930s.
-   The first functional programming language, Lisp, was designed in 1950s. Lisp is also the second oldest high level programming language still widely used today. It is only 1 year younger than Fortran, an imperative programming language.
-   LINQ query expression is rooted in monad, a concept of category theory. Category theory was started in 1940s, and monad was introduced into category theory in 1950s. Then monad programming appeared in Opal language in 1980s. In 1990s it was already heavily used in Haskell language.

Besides covering C# language’s functional features and functional LINQ queries, this tutorial also discusses lambda calculus and category theory. By demystifying the rationale and foundations , these knowledge can build a in depth understanding of functional programming, also greatly help understanding other functional programming languages.