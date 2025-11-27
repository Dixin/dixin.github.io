---
title: "Functional Programming and LINQ Paradigm (2) Programming Paradigms and Functional Programming"
published: 2019-05-28
description: "Object-oriented programming and functional programming are programming paradigms. A programming paradigm is a fundamental style or approach of programming. Paradigms are not mutually exclusive. It is"
image: ""
tags: [".NET", "C#", "LINQ", "LINQ via C#", "Ruby", "TSQL", "Introducing LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

Object-oriented programming and functional programming are programming paradigms. A programming paradigm is a fundamental style or approach of programming. Paradigms are not mutually exclusive. It is common for one programming language to support multiple paradigms, and C# is such a language.

### Programming paradigms

There are many programming paradigms. The following list shows a few common paradigms and their subparadigms:

· [Declarative programming:](https://en.wikipedia.org/wiki/Declarative_programming) designs what is the logic of operations, without describing its control flow (SQL, XQuery, etc.)

o [Functional programming](https://en.wikipedia.org/wiki/Functional_programming): uses expressions to describe operations, which are treated as call of functions (Erlang, F#, etc.)

§ [Purely functional programming](https://en.wikipedia.org/wiki/Purely_functional_programming): does not rely on mutable state (Haskell, Clean, etc.)

o [Logic programming](https://en.wikipedia.org/wiki/Logic_programming): designs the program with facts and rules in logical form (Prolog, Datalog, etc.)

· [Dynamic programming](https://en.wikipedia.org/wiki/Dynamic_programming_language): executes compile time behaviors at runtime (Python, PHP, etc.)

· [Event-driven programming](https://en.wikipedia.org/wiki/Event-driven_programming): drives the operations with events (JavaScript, TypeScript, etc.)

· [Generic programming](https://en.wikipedia.org/wiki/Generic_programming): supports type parameters for data structures and operations (Swift, VB.NET, etc.)

· [Imperative programming:](https://en.wikipedia.org/wiki/Imperative_programming) uses commands/statements to specify how the program operates (Assembly language, Fortran, etc.)

o [Object-oriented programming:](https://en.wikipedia.org/wiki/Object-oriented_programming) designs the program in objects, containing data in the form of fields, and behaviors in the form of methods

§ [Class-based programming](https://en.wikipedia.org/wiki/Class-based_programming): defines the data structure and behaviors as classes, and implements inheritance for classes (C++, Java, etc.)

§ [Prototype-based programming](https://en.wikipedia.org/wiki/Prototype-based_programming): implements classless prototypal inheritance and behavior reuse (Self, Lua, etc.)

o [Procedural programming](https://en.wikipedia.org/wiki/Procedural_programming): designs program in procedures and sub-procedures (C, Pascal, etc.)

· [Metaprogramming](https://en.wikipedia.org/wiki/Metaprogramming): accesses program code as data (Lisp, Ruby, etc.)

o [Reflective programming](https://en.wikipedia.org/wiki/Reflection_\(computer_programming\)): accesses the structure and behavior of the program itself at runtime (Delphi, Go, etc.)

C# is a sophisticated language with a lot of language features. Following the above paradigm descriptions, C# is declarative (C# has attribute, etc.), dynamic (has dynamic type), functional (has first class function), event-driven (has event), generic (supports generics), imperative (has statement, control flow), object-oriented (has first class object), class-based (has class), and can be procedural (with static method). C# also supports metaprogramming (supports code DOM, expression tree, CIL emit, compiler as a service) and is reflective (supports reflection).

So how functional is C#? C#’s initial release supports important functional features, and since then Microsoft keeps adding many more functional features to C# in each release, from small functional syntactic sugar for convenience to prominent functional features like LINQ:

· C# 1.0: delegate, higher-order function

· C# 2.0: generic delegate, anonymous method, closure, covariance and contravariance

· C# 3.0: extension method, lambda expression, LINQ query expression

· C# 4.0: covariance and contravariance for generics

· C# 5.0: asynchronous function

· C# 6.0: expression-bodied function members

· C# 7.0-7.3: local function, tuple, pattern matching, more expression-bodied members

So that C# has been a very functional language. All these language features are discussed in detail in each aspect of functional programming.

C# supports data mutation and state change by default, so C# is not a purely functional language. However, C# has plenty of features for immutability, laziness, etc., which helps writing elegant purely functional code. And in libraries provided by Microsoft, almost every LINQ API works in a purely functional way. These features are also discussed in detail too.

The topics of object-oriented programming (encapsulation, inheritance, polymorphism), dynamic programming (the dynamic type), and procedural programming (C-style procedures) are out of the scope of this book. C# event is discussed from a functional programming perspective. C# generics is very important feature for daily usage, and LINQ is entirely built with generics, so generic type, generic method, generic variants are discussed in detail. Metaprogramming with expression tree is also discussed in the LINQ to Entities internals chapter.

### Imperative programming vs. declarative programming

Functional programming is declarative, which means it focus on expressing what to do; Object-oriented programming is imperative, which means it specifies the detailed commands and steps of how to do. To compare these 2 paradigms, a task can be implemented to query the delegate types from the .NET core library:

· filter all the types to get delegate types

· group the delegate types by their namespaces

· sort the groups by each group’s delegate type count in descending order, and if 2 groups have identical delegate type count, then sort them by namespace in ascending order

The following example implements this query with traditional C# imperative programming:

internal static void DelegateTypes()
```
{
```
```
Assembly coreLibrary = typeof(object).Assembly;
```
```
IEnumerable<Type> allTypes = coreLibrary.ExportedTypes;
```
```
// Filter delegate types from all types, and group them by namespace.
```
```
Dictionary<string, List<Type>> delegateGroups = new Dictionary<string, List<Type>>();
```
```
foreach (Type type in allTypes)
```
```
{
```
```
// Delegate type's base type is System.MulticastDelegate.
```
```
if (type.BaseType == typeof(MulticastDelegate))
```
```
{
```
```
if (!delegateGroups.TryGetValue(type.Namespace, out List<Type> delegateGroup))
```
```
{
```
```
delegateGroup = delegateGroups[type.Namespace] = new List<Type>();
```
```
}
```
```
delegateGroup.Add(type);
```
```
}
```
```
}
```

```csharp
// Sort delegate type groups by count (descending), and then by namespace (ascending).
```
```
List<KeyValuePair<string, List<Type>>> sortedDelegateGroups =new List<KeyValuePair<string, List<Type>>>();
```
```
foreach (KeyValuePair<string, List<Type>> nextGroup in delegateGroups)
```
```
{
```
```
for (int index = 0; index <= sortedDelegateGroups.Count; index++)
```
```
{
```
```
if (index < sortedDelegateGroups.Count)
```
```
{
```
```
KeyValuePair<string, List<Type>> currentGroup = sortedDelegateGroups[index];
```
```
int compare = currentGroup.Value.Count - nextGroup.Value.Count;
```
```
if (compare == 0)
```
```
{
```
```
compare = string.CompareOrdinal(nextGroup.Key, currentGroup.Key);
```
```
}
```
```
if (compare >= 0)
```
```
{
```
```
continue;
```
```
}
```
```
}
```
```
sortedDelegateGroups.Insert(index, nextGroup);
```
```
break;
```
```
}
```
```
}
```
```
// Output the results.
```
```
foreach (KeyValuePair<string, List<Type>> delegateGroup in sortedDelegateGroups)
```
```
{
```
```
Trace.Write(delegateGroup.Value.Count + " in " + delegateGroup.Key + ":");
```
```
foreach (Type delegateType in delegateGroup.Value)
```
```
{
```
```
Trace.Write(" " + delegateType.Name);
```
```
}
```
```
Trace.Write(Environment.NewLine);
```
```
}
```
```
// 27 in System: Action`1 Action Action`2 Action`3 Action`4 Func`1 Func`2 Func`3 Func`4 Func`5 Action`5 Action`6 Action`7 Action`8 Func`6 Func`7 Func`8 Func`9 Comparison`1 Converter`2 Predicate`1 AssemblyLoadEventHandler AsyncCallback EventHandler EventHandler`1 ResolveEventHandler UnhandledExceptionEventHandler
```
```
// 8 in System.Threading: WaitCallback WaitOrTimerCallback IOCompletionCallback TimerCallback ContextCallback ParameterizedThreadStart SendOrPostCallback ThreadStart
```
```
// 3 in System.Reflection: MemberFilter ModuleResolveEventHandler TypeFilter
```
```
// 3 in System.Runtime.CompilerServices: TryCode CleanupCode CreateValueCallback
```

}

The following example is implemented with LINQ, which is totally declarative:

internal static void DelegateTypesWithQueryExpression()
```
{
```
```
Assembly coreLibrary = typeof(object).Assembly;
```
```
IEnumerable<IGrouping<string, Type>> delegateGroups =
```
```
from type in coreLibrary.ExportedTypes
```
```
where type.BaseType == typeof(MulticastDelegate)
```
```
group type by type.Namespace into delegateGroup
```
```
orderby delegateGroup.Count() descending, delegateGroup.Key
```
```
select delegateGroup;
```
```
foreach (IGrouping<string, Type> delegateGroup in delegateGroups) // Output.
```
```
{
```
```
Trace.Write(delegateGroup.Count() + " in " + delegateGroup.Key + ":");
```
```
foreach (Type delegateType in delegateGroup)
```
```
{
```
```
Trace.Write(" " + delegateType.Name);
```
```
}
```
```
Trace.Write(Environment.NewLine);
```
```
}
```

}

So imperative programming and declarative programming are very different styles and approaches. The imperative example specifies how to accomplish the task step by step:

· How to filter and group: use a dictionary of key value pairs to store the grouped delegate types, where each key is namespace, and each value is a list of delegate types under that namespace; Scan the types, if a type is a delegate type, then check whether its namespace is in dictionary as a key, if yes, get its type list, if not, add a key value pair to the dictionary, where key is the namespace, and value is an empty list of types; then add the delegate type to the existing or newly added type list.

· How to sort: copy each group from the dictionary to another sorted list. For each group, scan the groups already in the sorted list to compare delegate type counts, if equal then compare their namespaces; When the right position is found, insert each group to the sorted list.

The code here is a detailed control flow of statements and commands, including frequent data mutation (variables’ reassignment) and state change (collections’ item change). The business logic is less intuitive in the code.

The other example simply declares what is the task to accomplish:

· what is filtering logic: keep delegate types

· what is grouping logic: group delegate types by namespaces

· what is sorting logic: sort the groups in descending order of delegate type count, then in ascending order of namespace

Here an expression of clauses makes the business logic very clear. And there are no details needed, like data mutation or state change involved, at all.

Imperative/object-oriented programming has a history to think from lower level up. In the early years, computer hardware’s implementation is usually imperative and stateful, so machine code is designed to be imperative and can change hardware state in a control flow. Then, low level programming languages are designed, which usually have strong correspondence to the machine code with a little or no abstractions, so they are also imperative and stateful, like assembly language. Later, higher level programming languages are designed as abstraction of low level languages and usually more portable, but they are still imperative and stateful. For example, C is the abstractions of assembly languages, C++ was initially called C with Classes and designed as extension of C. C# is also rooted in C family of high level languages to make itself immediately familiar to programmers of C, C++, and Java, etc., so C# is imperative and stateful by default as well. Actually, Microsoft used to call it Cool, stood for C-like Object Oriented Language. Many of its elements, like int (System.Int32), long (System.Int64), flow control, etc., are abstracted all the way from hardware.

In contrast, declarative/functional programming is to think from higher level. It is usually abstractions of the mathematics and logic. The elements in above LINQ query, like where clause, group by clause, order by clause, etc., are such abstractions. It disregards the lower level details of how exactly the declared operations should be executed, like how to change state and how to mutate data, etc. In the next section, more examples demonstrates how this

Eventually, computer hardware is imperative. So declarative/functional code usually needs to translated to imperative code to execute in hardware. This work is usually done by compilers at compile time, and API calls at runtime, so that at design time, the code is kept declarative and functional. Later, this book discusses how declarative and functional LINQ is internally implemented by C# compiler and query APIs.

Besides functional programming and LINQ, C# and .NET Standards provide other declarative features and APIs. For example, attribute is widely used to associate declarative information with code elements, including assembly, module, type, type member, function parameter and return value. Regular expression APIs can be viewed as declarative, because it declares what pattern to match, not how to match. There are syntactic sugars like object initializer, collection initializer, etc., which make C# more declarative and less imperative. These are discussed in the C# language basics chapter.

### Object-oriented programming vs. functional programming

In object-oriented programming, object can have behaviours in the form of method, comparing to function in functional programming, they are both modularized reusable code block. They are different in multiple aspects:

· As fore mentioned, functional programming is more declarative. It encourages expression rather than statement, focuses on what to do, and avoids how to do, especially avoids how to mutate data or change state.

· Function in functional programming is treated as first class citizen, just like first class object in object-oriented programming. For example, a function can be passed around like a data value, or used as input/output of another function.

· Functional programming encourages pure function. First, pure function works like mathematics function that simply maps from a set of input to a set of output, and each certain input always leads to a certain output. In another word, a pure function’s output only depends on the input. This is different from object-oriented programming, where method’s execution result can commonly depend on local object’s state or global state. Second, pure function has no side effects, which means no interaction with the outside world of the function. For example, LINQ APIs use deferred execution to implement purity. This is also different from object-oriented programming, where method’s execution can commonly change local object’s state or global state, or produce I/O.

· Functional programming also emphasizes function composition, rather than object inheritance/composition in object-oriented programming.

In the previous example, LINQ query expression is actually implemented with the following function calls (In practice, LINQ code can be written with either syntax. They are totally equivalent. The previous query syntax is compiled to the following query, and the compilation is discussed in detail later):

internal static void DelegateTypesWithQueryMethods()
```
{
```
```
Assembly coreLibrary = typeof(object).Assembly;
```
```
IEnumerable<IGrouping<string, Type>> delegateGroups = coreLibrary.ExportedTypes
```
```
.Where(type => type.BaseType == typeof(MulticastDelegate))
```
```
.GroupBy(type => type.Namespace)
```
```
.OrderByDescending(delegateGroup => delegateGroup.Count())
```
```
.ThenBy(delegateGroup => delegateGroup.Key);
```
```
foreach (IGrouping<string, Type> delegateGroup in delegateGroups) // Output.
```
```
{
```
```
Trace.Write(delegateGroup.Count() + " in " + delegateGroup.Key + ":");
```
```
foreach (Type delegateType in delegateGroup)
```
```
{
```
```
Trace.Write(" " + delegateType.Name);
```
```
}
```
```
Trace.Write(Environment.NewLine);
```
```
}
```
```
}
```

Here Where, GroupBy, OrderBy, ThenBy are functions composed together by fluent chaining, each function’s output becomes the next function’s input. They are pure functions, so their output data only depends on the input data. They do not depend on any state, and do not change any state, which is implemented by deferred execution. They also accept an additional input, which is also a function. Each input function is defined on the fly without a function name. This is called anonymous function. Each anonymous function is passed to another function as argument, just like passing a data value. These input functions are also pure. The Where, GroupBy, OrderBy, ThenBy functions are called higher-order function, since they can have another function as input/output. Function composition, fluent chaining, pure function, deferred execution, anonymous function, higher-order function and first class function are discussed in detail later.

To further demonstrate, a task can be implemented to process document:

· Download a source file from the specified URI

· Convert the source file to another format with the specified template file.

The following example designs the task with object-oriented paradigm:

internal class Crawler
```
{
```
```csharp
private readonly DirectoryInfo downloadDirectory;
```
```
internal Crawler(DirectoryInfo downloadDirectory)
```
```
{
```
```
this.downloadDirectory = downloadDirectory;
```
```
}
```
```
// Download the specified URI to the download directory.
```
```
internal FileInfo Download(Uri sourceUri)
```
```
{
```
```
throw new NotImplementedException();
```
```
}
```
```
}
```
```
internal class Template
```
```
{
```
```csharp
private readonly FileInfo templateFile;
```
```
internal Template(FileInfo templateFilerr
```
```
this.templateFile = templateFile;
```
```
}
```
```
// Convert the specified HTML document with template.
```
```
internal FileInfo Convert(FileInfo sourceFile)
```
```
{
```
```
throw new NotImplementedException();
```
```
}
```
```
}
```
```
internal class DocumentBuilder
```
```
{
```
```csharp
private readonly Crawler crawler;
```

```csharp
private readonly Template template;
```
```
internal DocumentBuilder(Crawler crawler, Templatetemplate)
```
```
{
```
```
this.crawler = crawler;
```
```
this.template = template;
```
```
}
```
```
internal FileInfo Build(Uri uri)
```
```
{
```
```
FileInfo htmlDocument = this.crawler.Download(uri);
```
```
return this.template.Convert(htmlDocument);
```
```
}
```

}

The above Crawler class provides the operation to download the document to a directory. Template class provides the operation to convert a document with template. To focus on the paradigm, the implementations are omitted. To build the document, DocumentBuilder class is defined to compose crawler and template. The following code demonstrates how the task can be done using instances of above classes:

internal static void BuildDocument(Uri sourceUri, DirectoryInfo downloadDirectory, FileInfo templateFile)
```
{
```
```
DocumentBuilder builder = new DocumentBuilder(new Crawler(downloadDirectory), new Template(templateFile));
```
```
FileInfo resultFile = builder.Build(sourceUri);
```

}

In functional paradigm, each operation can be simply modelled as a function, and functions can be composed:

internal static FileInfo Download(Uri sourceUri, DirectoryInfo downloadDirectory)
```
{
```
```
throw new NotImplementedException();
```
```
}
```
```
internal static FileInfo Convert(FileInfo sourceFile, FileInfo templateFile)
```
```
{
```
```
throw new NotImplementedException();
```
```
}
```
```
internal static Func<Uri, DirectoryInfo, FileInfo, FileInfo> CreateDocumentBuilder(
```
```
Func<Uri, DirectoryInfo, FileInfo> download, Func<FileInfo, FileInfo, FileInfo> convert)
```
```
{
```
```
return (sourceUri, downloadDirectory, templateFile) =>
```
```
{
```
```
FileInfo sourceFile = download(sourceUri, downloadDirectory);
```
```
return convert(sourceFile, templateFile);
```
```
};
```

}

This is how the task can be done using above functions:

internal static void BuildDocument(Uri sourceUri, DirectoryInfo downloadDirectory, FileInfo templateFile)
```
{
```
```
Func<Uri, DirectoryInfo, FileInfo, FileInfo> buildDocument = CreateDocumentBuilder(Download, Convert);
```
```
FileInfo resultFile = buildDocument(sourceUri, downloadDirectory, templateFile);
```

}

Here CreateDocumentBuilder function is called with Download and Convert as input, and it outputs another function, which is a composition of Download and Convert. These function are passed just like passing data values. This also demonstrates in C# functions are first class citizens.

Many C# functional programming features are relatively younger than its imperative/object-oriented features. Some major features, like lambda expression, query expression, are introduced to C# since 3.0. However, functional programming as is actually a very old fashion. Functional programming came from lambda calculus, which was invented in 1930s. The first functional programming language, Lisp, was designed in 1950s. Lisp is the second oldest high-level programming language still widely used today. It is only 1 year younger than Fortran, an imperative programming language still widely used. Another example is LINQ query expression. It is rooted in monad, a concept of category theory. Category theory was started in 1940s, and monad was introduced into category theory in 1950s. Later monad programming appeared in Opal language in 1980s. Since 1990s it has been heavily used in Haskell language. Lambda calculus and category theory are discussed in detail in part 3, since they are the rationale and foundations of functional programming and LINQ.