---
title: "Functional Programming and LINQ via C#"
published: 2025-03-02
description: "!"
image: ""
tags: [".NET", "C#", "Functional Programming", "LINQ", "LINQ via C#", ".NET Core", ".NET Standard", "C# 8.0"]
category: ".NET"
draft: false
lang: ""
---

![ezgif-1-93576e9d87](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/72436fc4c617_10FA4/ezgif-1-93576e9d87_3.jpg "ezgif-1-93576e9d87")

-   [Acclaim](#acclaim)
-   [Contents at a Glance](#contentsataglance)
-   [Table of Contents](#contents)

This is a book on functional programming and LINQ programming via C# language. It discusses:

-   Functional programming via C# in-depth
-   Use functional LINQ to work with local data and cloud data
-   The underlying mathematics theories of functional programming and LINQ, including Lambda Calculus and Category Theory

### Acclaim

Microsoft:

-   “An excellent book for those of us who need to get in-depth understanding on LINQ and functional programming with latest C# language. The author made sure this book includes the latest and cross-platform knowledge for the language, the framework, as well as the underlying mathematical theories.” **Hongfei Guo Partner Group Engineering Manager at Microsoft**
-   “This book explains practical and in-depth material clearly, concisely and accurately to the areas of the C# language, functional programming, and LINQ on .NET Framework and .NET Core. This is a great book for anyone wanting to understand the whys and hows behind these important technologies.” **Samer Boshra Principal Software Development Engineer at Microsoft**
-   “This is a great book for developers who want to go functional programming. It's one-stop shopping for serious developers who have to get up to speed with LINQ and functional programming quickly and in-depth. I'll keep this book on my desk not on my bookshelf.” **Roshan Kommusetty Principal Software Engineering Manager at Microsoft**
-   “This is a great book for C# developers, it covers both basic C# programming concepts for the beginners new to the .NET world, and C# advanced constructs for experienced .NET programmers. The book is up to date, talks C# 7.0 new language features and demonstrates how you can use them for functional programming. Thanks for the awesome work!” **Mark Zhou Principal Software Engineering Manager at Microsoft**
-   “I like the way the author presented the detailed knowledge with a lot of examples. As a data scientist with statistics background in a number of industries, I can pick up C# programming and LINQ quickly when I followed the book. The book was concise and easy to read. It was a pleasant experience for me to spend my time emerging myself in the book in the sunshine weekday afternoon.” **Xue Liu Senior Data Scientist at Microsoft**
-   “Functional Programming and LINQ in C# language, have been fully and clearly unraveled in this book, with many practical examples. The author has not saved any effort to go beyond scratching the surface of C# language and has successfully explained the magic behind the scene. This book is a must-have for anyone who wants to understand functional programming using C#.” **Jie Mei Data & Applied Scientist at Microsoft**

Academy and more:

-   “This book provides comprehensive and in-depth information about the C# functional programming and LINQ technologies to application developers on both .NET Framework and .NET Core. The detailed text and wealth of examples will give a developer a clear and solid understanding of C# language, functional programming and using LINQ to work with different data domains.” **Dong Si Assistant Professor, Department of Computer Science, University of Washington, Bothell**
-   “This book offers a comprehensive, in-depth, yet easy-to-understand tutorial to functional C# programming and LINQ. Filled with detailed explanations and real-world examples, this book is highly valuable for beginners and experienced developers alike.” **Shuang Zhao Assistant Professor, Department of Computer Science, University of California, Irvine**
-   “This excellent book is an in-depth and also readable exploration of C# functional programming and LINQ programming. It covers .NET Framework and .NET Core in great detail.” **Yang Sha Engineering Manager at Google**
-   “Great book! It takes a hands-on approach to LINQ and functional programming in an easy to understand format. I would highly recommend this book to developers looking to develop expertise in C#, functional programming, and LINQ.” **Himanshu Lal Software Engineering Manager at Facebook**
-   “This is a great book that combines practical examples with in-depth analysis of LINQ and functional programming in C#. Dixin leverages his expertise in .NET to provide a well written tutorial on the effective use of LINQ and an overview of the theoretical principles behind it. A must read for anyone working on these technologies!” **Dimitrios Soulios Director at Goldman Sachs**

### Contents at a Glance

The contents are organized as the following chapters:

-   **Part 1 Code** \- covers functional programming via C#, and fundamentals of LINQ.
    -   **Chapter 1 Functional programming and LINQ paradigm**
        -   What is LINQ, how LINQ uses language to work with many different data domains.
        -   Programming paradigm, imperative vs. declarative programming, object-oriented vs. functional programming.
    -   **Chapter 2 Functional programming in depth**
        -   C# fundamentals for beginners.
        -   Aspects of functional programming via C#, including function type, named/anonymous/local function, closure, lambda, higher-order function, currying, partial application, first class function, function composition, query expression, covariance/contravariance, immutability, tuple, purity, async function, pattern matching, etc., including how C# is processed at compile time and runtime.
-   **Part 2 Data** - covers how to use functional LINQ to work with different data domains in the real world, and how LINQ works internally.
    -   **Chapter 3 LINQ to Objects**
        -   How to use functional LINQ queries to work with objects, covering all LINQ and Ix.
        -   How the LINQ to Objects query methods are implemented, how to implement useful custom LINQ queries.
    -   **Chapter 4 LINQ to XML**
        -   How to modeling XML data, and use functional LINQ queries to work with XML data.
        -   How to use the other LINQ to XML APIs to manipulate XML data.
    -   **Chapter 5 Parallel LINQ**
        -   How to use parallelized functional LINQ queries to work with objects.
        -   Performance analysis for parallel/sequential LINQ queries.
    -   **Chapter 6 Entity Framework/Core and LINQ to Entities**
        -   How to model database with object-relational mapping, and use functional LINQ queries to work with relational data in database.
        -   How the C# LINQ to Entities queries are implemented to work with database.
        -   How to change data in database, and handle concurrent conflicts.
        -   Performance tips and asynchrony.
-   **Part 3 Theories** - demystifies the abstract mathematics theories, which are the rationale and foundations of LINQ and functional programming.
    -   **Chapter 7 Lambda Calculus via C#**
        -   Core concepts of lambda calculus, bound and free variables, reduction (α-conversion, β-reduction, η-conversion), etc.
        -   How to use lambda functions to represent values, data structures and computation, including Church Boolean, Church numbers, Church pair, Church list, and their operations.
        -   Combinators and combinatory logic, including SKI combinator calculus, fixed point combinator for function recursion, etc.
    -   **Chapter 8 Category Theory via C#**
        -   Core concepts of category theory, including category, object, morphism, monoid, functor, natural transformation, applicative functor, monad, and their laws.
        -   How these concepts are applied in functional programming and LINQ.
        -   How to manage I/O, state, exception handling, shared environment, logging, and continuation, etc., in functional programming.

This tutorial delivers highly reusable knowledge:

-   It covers C# language in depth, which can be generally applied in any programming paradigms besides functional programming.
-   It is a cross platform tutorial, covering both .NET Framework for Windows and .NET Core for Windows, Mac, Linux.
-   It demonstrates both usage and implementation of LINQ for mainstream data domains, which also enables developer to use the LINQ technologies for other data domains, or build custom LINQ APIs for specific data scenarios.
-   It also demystifies the abstract mathematics knowledge for functional programming, which applies to general functional programming, so it greatly helps developers understanding any other functional languages too.

As a fun of functional programming, LINQ, C#, and .NET technologies, hope this helps.

### Table of Contents

All code examples are available on GitHub: https://github.com/Dixin/CodeSnippets.

1.  ## [Functional programming and LINQ paradigm](/archive/?tag=Introducing%20LINQ)
    
    1.  ### [Cross platform C# and .NET](/posts/linq-via-csharp-introduction)
        
        -   Introducing cross platform .NET, C# and LINQ
            -   .NET Framework, C#, and LINQ
            -   .NET Core, UWP, Mono, Xamarin and Unity
            -   .NET Standard
        -   Introducing this book
            -   Book structure
            -   Code examples
        -   Start coding
            -   Start coding with Visual Studio (Windows)
            -   Start coding with Visual Studio Code (Windows, macOS and Linux)
            -   Start coding with Visual Studio for Mac (macOS)
    2.  ### [Programming paradigms and functional programming](/posts/introducing-linq-3-waht-is-functional-programming)
        
        -   Programming paradigms
        -   Imperative programming vs. declarative programming
        -   Object-oriented programming vs. functional programming
    3.  ### [LINQ to data sources](/posts/introducing-linq-2-what-is-linq)
        
        -   One language for different data domains
            -   LINQ to Objects
            -   Parallel LINQ
            -   LINQ to XML
            -   LINQ to DataSets
            -   LINQ to Entities
            -   LINQ to SQL
            -   LINQ to NoSQL (LINQ to CosmosDB)
            -   LINQ to JSON
            -   LINQ to Twitter
        -   Sequential query vs. parallel query
        -   Local query vs. remote query
2.  ## [Functional programming in depth](/archive/?tag=Functional%20C%23)
    
    1.  ### [C# language basics](/posts/functional-csharp-fundamentals)
        
        -   Types and members
            -   Types and members
            -   Built-in types
        -   Reference type vs. value type
            -   ref local variable and immutable ref local variable
            -   Array and stack-allocated array
            -   Default value
            -   ref structure
        -   Static class
        -   Partial type
        -   Interface and implementation
            -   IDisposable interface and using declaration
        -   Generic type
            -   Type parameter
            -   Type parameter constraints
        -   Nullable value type
        -   Auto property
        -   Property initializer
        -   Object initializer
        -   Collection initializer
        -   Index initializer
        -   Null coalescing operator
        -   Null conditional operator
        -   throw expression
        -   Exception filter
        -   String interpolation
        -   nameof operator
        -   Digit separator and leading underscore
    2.  ### [Named function and function polymorphism](/posts/functional-csharp-function-type-and-delegate)
        
        -   Constructor, static constructor and finalizer
        -   Static method and instance method
        -   Extension method
        -   More named functions
        -   Function polymorphisms
            -   Ad hoc polymorphism: method overload
            -   Parametric polymorphism: generic method
                -   Type argument inference
        -   Static import
        -   Partial method
    3.  ### [Local function and closure](/posts/functional-csharp-local-function-and-closure)
        
        -   Local function
        -   Closure
            -   Outer variable
            -   Implicit reference
            -   Static local function
    4.  ### [Function input and output](/posts/functional-csharp-function-parameter-and-return-value)
        
        -   Input by copy vs. input by alias (ref parameter)
            -   Input by immutable alias (in parameter)
        -   Output parameter (out parameter) and out variable
            -   Discarding out variable
        -   Parameter array
        -   Positional argument vs. named argument
        -   Required parameter vs. optional parameter
        -   Caller information parameter
        -   Output by copy vs. output by alias
            -   Output by immutable alias
    5.  ### [Delegate: Function type, instance, and group](/posts/functional-csharp-local-function-and-closure)
        
        -   Delegate type as function type
            -   Function type
            -   Generic delegate type
            -   Unified built-in delegate types
        -   Delegate instance as function instance
        -   Delegate instance as function group
            -   Event and event handler
    6.  ### [Anonymous function and lambda expression](/posts/functional-csharp-anonymous-function-and-lambda-expression)
        
        -   Anonymous method
        -   Lambda expression as anonymous function
            -   IIFE (Immediately-invoked function expression)
            -   Closure
        -   Expression bodied function member
    7.  ### [Expression tree: Function as data](/posts/functional-csharp-function-as-data-and-expression-tree)
        
        -   Lambda expression as expression tree
            -   Metaprogramming: function as abstract syntax tree
            -   .NET expressions
        -   Compile expression tree at runtime
            -   Traverse expression tree
            -   Expression tree to CIL at runtime
            -   Expression tree to executable function at runtime
        -   Expression tree and LINQ remote query
    8.  ### [Higher-order function, currying and first class function](/posts/functional-csharp-higher-order-function-currying-and-first-class-function)
        
        -   First order function vs. higher-order function
            -   Convert first-order function to higher-order function
            -   Lambda operator => associativity
        -   Curry function
            -   Uncurry function
            -   Partial applying function
        -   First-class function
    9.  ### [Function composition and chaining](/posts/functional-csharp-function-composition-and-method-chaining)
        
        -   Forward composition vs. backward composition
        -   Forward piping
        -   Method chaining and fluent interface
    10.  ### [LINQ query expression](/posts/functional-csharp-query-expression)
         
         -   Syntax and compilation
         -   Query expression pattern
         -   LINQ query expression
             -   Forward piping with LINQ
         -   Query expression vs. query method
    11.  ### [Covariance and contravariance](/posts/functional-csharp-covariance-and-contravariance)
         
         -   Subtyping and type polymorphism
         -   Variances of non-generic function type
         -   Variances of generic function type
         -   Variances of generic interface
         -   Variances of generic higher-order function type
         -   Covariance of array
         -   Variances in .NET and LINQ
    12.  ### [Immutability, anonymous type and tuple](/posts/functional-csharp-immutability-anonymous-type-and-tuple)
         
         -   Immutable value
             -   Constant local
             -   Enumeration
             -   using declaration and foreach statement
             -   Immutable alias (immutable ref local variable)
             -   Function’s immutable input and immutable output
             -   Range variable in LINQ query expression
             -   this reference for class
         -   Immutable state (immutable type)
             -   Constant field
             -   Immutable class with readonly instance field
             -   Immutable structure (readonly structure)
             -   Immutable anonymous type
                 -   Local variable type inference
             -   Immutable tuple vs. mutable tuple
                 -   Construction, element name and element inference
                 -   Deconstruction
                 -   Tuple assignment
             -   Immutable collection vs. readonly collection
             -   Shallow immutability vs. deep immutability
    13.  ### [Pure function](/posts/functional-csharp-pure-function)
         
         -   Pure function vs. impure function
             -   Referential transparency and side effect free
         -   Purity in .NET
         -   Purity in LINQ
    14.  ### [Asynchronous function](/posts/functional-csharp-asynchronous-function)
         
         -   Task, Task<TResult> and asynchrony
         -   Named async function
         -   Awaitable-awaiter pattern
         -   Async state machine
         -   Runtime context capture
         -   Generalized async return type and async method builder
             -   ValueTask<TResult> and performance
         -   Anonymous async function
         -   Asynchronous sequence: IAsyncEnumerable<T>
         -   async using declaration: IAsyncDispose
    15.  ### [Pattern matching](/posts/functional-csharp-pattern-matching)
         
         -   Is expression
         -   switch statement and switch expression
3.  ## [LINQ to Objects: Querying objects in memory](/archive/?tag=LINQ%20to%20Objects)
    
    1.  ### [Local sequential LINQ query](/posts/linq-to-objects-local-sequential-query)
        
        -   Iteration pattern and foreach statement
        -   IEnumerable<T> and IEnumerator<T>
            -   foreach loop vs. for loop
            -   Non-generic sequence vs. generic sequence
        -   LINQ to Objects queryable types
    2.  ### [LINQ to Objects standard queries and query expressions](/posts/linq-to-objects-query-methods-operators-and-query-expressions)
        
        -   Sequence queries
            -   Generation: Empty , Range, Repeat, DefaultIfEmpty
            -   Filtering (restriction): Where, OfType, where
            -   Mapping (projection): Select, SelectMany, from, let, select
            -   Grouping: GroupBy, group, by, into
            -   Join
                -   Inner join: Join, SelectMany, join, on, equals
                -   Outer join: GroupJoin, join, into, on, equals
                -   Cross join: SelectMany, Join, from select, join, on, equals
            -   Concatenation: Concat
            -   Set: Distinct, Union, Intersect, Except
            -   Convolution: Zip
            -   Partitioning: Take, Skip, TakeWhile, SkipWhile
            -   Ordering: OrderBy, ThenBy, OrderByDescending, ThenByDescending, Reverse, orderby, ascending, descending, into
            -   Conversion: Cast, AsEnumerable
        -   Collection queries
            -   Conversion: ToArray, ToList, ToDictionary, ToLookup
        -   Value queries
            -   Element: First, FirstOrDefault, Last, LastOrDefault, ElementAt, ElementAtOrDefault, Single, SingleOrDefault
            -   Aggregation: Aggregate, Count, LongCount, Min, Max, Sum, Average
            -   Quantifier: All, Any, Contains
            -   Equality: SequenceEqual
        -   Queries in other languages
    3.  ### [Generator](/posts/linq-to-objects-generator)
        
        -   Implementing iterator pattern
        -   Generating sequence and iterator
        -   Yield statement and generator
    4.  ### [Deferred execution, lazy evaluation and eager Evaluation](/posts/linq-to-objects-deferred-execution-lazy-evaluation-and-eager-evaluation)
        
        -   Immediate execution vs. Deferred execution
            -   Cold IEnumerable<T> vs. hot IEnumerable<T>
        -   Lazy evaluation vs. eager evaluation
    5.  ### [LINQ to Objects internals: Standard queries implementation](/posts/linq-to-objects-query-methods-implementation)
        
        -   Argument check and deferred execution
        -   Collection queries
            -   Conversion: ToArray, ToList, ToDictionary, ToLookup
        -   Sequence queries
            -   Conversion: Cast, AsEnumerable
            -   Generation: Empty , Range, Repeat, DefaultIfEmpty
            -   Filtering (restriction): Where, OfType
            -   Mapping (projection): Select, SelectMany
            -   Grouping: GroupBy
            -   Join: SelectMany, Join, GroupJoin
            -   Concatenation: Concat
            -   Set: Distinct, Union, Intersect, Except
            -   Convolution: Zip
            -   Partitioning: Take, Skip, TakeWhile, SkipWhile
            -   Ordering: OrderBy, ThenBy, OrderByDescending, ThenByDescending, Reverse
        -   Value queries
            -   Element: First, FirstOrDefault, Last, LastOrDefault, ElementAt, ElementAtOrDefault, Single, SingleOrDefault
            -   Aggregation: Aggregate, Count, LongCount, Min, Max, Sum, Average
            -   Quantifier: All, Any, Contains
            -   Equality: SequenceEqual
    6.  ### [Advanced queries in Microsoft Interactive Extensions (Ix)](/posts/linq-to-objects-interactive-extensions-ix)
        
        -   Sequence queries
            -   Generation: Defer, Create, Return, Repeat
            -   Filtering: IgnoreElements, DistinctUntilChanged
            -   Mapping: SelectMany, Scan, Expand
            -   Concatenation: Concat, StartWith
            -   Set: Distinct
            -   Partitioning: TakeLast, SkipLast
            -   Conversion: Hide
            -   Buffering: Buffer, Share, Publish, Memoize
            -   Exception: Throw, Catch, Finally, OnErrorResumeNext, Retry
            -   Imperative: If, Case, Using, While, DoWhile, Generate, For
            -   Iteration: Do
        -   Value queries
            -   Aggregation: Min, Max, MinBy, MaxBy
            -   Quantifiers: isEmpty
        -   Void queries
            -   Iteration: ForEach
    7.  ### [Building custom queries](/posts/linq-to-objects-custom-query-methods)
        
        -   Sequence queries (deferred execution)
            -   Generation: Create, RandomInt32, RandomDouble, FromValue, FromValues, EmptyIfNull
            -   Filtering: Timeout
            -   Concatenation: Join, Append, Prepend, AppendTo, PrependTo
            -   Partitioning: Subsequence
            -   Exception: Catch, Retry
            -   Comparison: OrderBy, OrderByDescending, ThenBy, ThenByDescending, GroupBy, Join, GroupJoin, Distinct, Union, Intersect, Except
            -   List: Insert, Remove, RemoveAll, RemoveAt
        -   Collection queries
            -   Comparison: ToDictionary, ToLookup
        -   Value queries
            -   List: IndexOf, LastIndexOf
            -   Aggregation: PercentileExclusive, PercentileInclusive, Percentile
            -   Quantifiers: IsNullOrEmpty, IsNotNullOrEmpty
            -   Comparison: Contains, SequenceEqual
        -   Void queries
            -   Iteration: ForEach
4.  ## [LINQ to XML: Querying XML](/archive/?tag=LINQ%20to%20XML)
    
    1.  ### [Modeling XML](/posts/linq-to-xml-1-modeling-xml)
        
        -   Imperative vs. declarative paradigm
        -   Types, conversions and operators
        -   Read and deserialize XML
        -   Serialize and write XML
        -   Deferred construction
    2.  ### [LINQ to XML standard queries](/posts/linq-to-xml-2-query-methods)
        
        -   Navigation
        -   Ordering
        -   Comparison
        -   More useful queries
        -   XPath
            -   Generate XPath expression
    3.  ### [Manipulating XML](/posts/linq-to-xml-3-manipulating-xml)
        
        -   Clone
        -   Adding, deleting, replacing, updating, and events
        -   Annotation
        -   Validating XML with XSD
        -   Transforming XML with XSL
5.  ## [Parallel LINQ: Querying objects in parallel](/archive/?tag=Parallel%20LINQ)
    
    1.  ### [Parallel LINQ query and visualization](/posts/parallel-linq-1-local-parallel-query-and-visualization)
        
        -   Parallel query vs. sequential query
        -   Parallel query execution
        -   Visualizing parallel query execution
            -   Using Concurrency Visualizer
            -   Visualizing sequential and parallel LINQ queries
            -   Visualizing chaining query methods
    2.  ### [Parallel LINQ internals: data partitioning](/posts/parallel-linq-2-partitioning)
        
        -   Partitioning and load balancing
            -   Range partitioning
            -   Chunk partitioning
            -   Hash partitioning
            -   Stripped partitioning
        -   Implement custom partitioner
            -   Static partitioner
            -   Dynamic partitioner
    3.  ### [Parallel LINQ standard queries](/posts/parallel-linq-3-query-methods)
        
        -   Query settings
            -   Cancellation
            -   Degree of parallelism
            -   Execution mode
            -   Merge the values
        -   Ordering
            -   Preserving the order
            -   Order and correctness
            -   Orderable partitioner
        -   Aggregation
            -   Commutativity, associativity and correctness
            -   Partitioning and merging
    4.  ### [Parallel query performance](/posts/parallel-linq-4-performance)
        
        -   Sequential query vs. parallel query
        -   CPU bound operation vs. IO bound operation
        -   Factors to impact performance
6.  ## [Entity Framework/Core and LINQ to Entities: Querying relational data](/archive/?tag=Entity%20Framework)
    
    1.  ### [Remote LINQ query](/posts/entity-framework-core-and-linq-to-entities-1-remote-query)
        
        -   Entity Framework and Entity Framework Core
        -   SQL database
        -   Remote query vs. local query
        -   Function vs. expression tree
    2.  ### [Modeling database with object-relational mapping](/posts/entity-framework-core-and-linq-to-entities-2-modeling-database-object-relational-mapping)
        
        -   Data types
        -   Database
            -   Connection resiliency and execution retry strategy
        -   Tables
        -   Relationships
            -   One-to-one
            -   One-to-many
            -   Many-to-many
        -   Inheritance
        -   Views
    3.  ### [Logging and tracing LINQ to Entities queries](/posts/entity-framework-core-and-linq-to-entities-3-logging-and-tracing-queries)
        
        -   Application side logging
        -   Database side tracing with Extended Events
    4.  ### [LINQ to Entities standard queries](/posts/entity-framework-core-and-linq-to-entities-4-query-methods)
        
        -   Sequence queries
            -   Generation: DefaultIfEmpty
            -   Filtering (restriction): Where, OfType
            -   Mapping (projection): Select
            -   Grouping: GroupBy
            -   Join
                -   Inner join: Join, SelectMany, GroupJoin, Select
                -   Outer join: GroupJoin, Select, SelectMany
                -   Cross join and self join: SelectMany, Join
            -   Concatenation: Concat
            -   Set: Distinct, Union, Intersect, Except
            -   Partitioning: Take, Skip
            -   Ordering: OrderBy, ThenBy, OrderByDescending, ThenByDescending
            -   Conversion: Cast, AsQueryable
        -   Value queries
            -   Element: First, FirstOrDefault, Single, SingleOrDefault
            -   Aggregation: Count, LongCount, Min, Max, Sum, Average
            -   Quantifier: All, Any, Contains
    5.  ### [LINQ to Entities internals: Query translation implementation](/posts/entity-framework-core-and-linq-to-entities-5-query-translation-implementation)
        
        -   Code to LINQ expression tree
            -   IQueryable<T> and IQueryProvider
            -   Standard remote queries
            -   Building LINQ to Entities abstract syntax tree
        -   .NET expression tree to database expression tree
            -   Database query abstract syntax tree
            -   Compiling LINQ expressions to database expressions
            -   Compiling LINQ queries
            -   Compiling .NET API calls
            -   Remote API call vs. local API call
            -   Compile database functions and operators
        -   Database expression tree to database query language
            -   SQL generator and SQL command
            -   Generating SQL from database expression tree
    6.  ### [Loading query data](/posts/entity-framework-core-and-linq-to-entities-6-query-data-loading)
        
        -   Deferred execution
            -   Iterator pattern
            -   Lazy evaluation vs. eager evaluation
        -   Explicit loading
        -   Eager loading
        -   Lazy loading
            -   The N + 1 problem
            -   Disabling lazy loading
    7.  ### [Manipulating relational data: Data change and transaction](/posts/entity-framework-core-and-linq-to-entities-7-data-changes-and-transactions)
        
        -   Repository pattern and unit of work pattern
        -   Tracking entities and changes
            -   Tracking entities
            -   Tracking entity changes and property changes
            -   Tracking relationship changes
            -   Enabling and disabling tracking
        -   Change data
            -   Create
            -   Update
            -   Delete
        -   Transaction
            -   Transaction with connection resiliency and execution strategy
            -   EF Core transaction
            -   ADO.NET transaction
            -   Transaction scope
    8.  ### [Resolving optimistic concurrency](/posts/entity-framework-core-and-linq-to-entities-8-optimistic-concurrency)
        
        -   Detecting concurrent conflicts
        -   Resolving concurrent conflicts
            -   Retaining database values (database wins)
            -   Overwriting database values (client wins)
            -   Merging with database values
        -   Saving changes with concurrent conflict handling
7.  ## [Lambda Calculus via C#: The foundation of all functional programming](/archive/?tag=Lambda%20Calculus)
    
    1.  ### [Basics](/posts/lambda-calculus-via-c-1-fundamentals)
        
        -   Expression
            -   Bound variable vs. free variable
        -   Reductions
            -   α-conversion (alpha-conversion)
            -   β-reduction (beta-reduction)
            -   η-conversion (eta-conversion)
            -   Normal order
            -   Applicative order
        -   Function composition
            -   Associativity
            -   Unit
    2.  ### [Church encoding: Function as boolean and logic](/posts/lambda-calculus-via-c-2-boolean-and-logic)
        
        -   Church encoding
        -   Church Boolean
        -   Logical operators
        -   Conversion between Church Boolean and System.Boolean
        -   If
    3.  ### [Church encoding: Function as numeral, arithmetic and predicate](/posts/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate)
        
        -   Church numerals
        -   Increase and decrease
        -   Arithmetic operators
        -   Predicate and relational operators
            -   Attempt of recursion
        -   Conversion between Church numeral and System.UInt32
    4.  ### [Church encoding: Function as tuple and signed numeral](/posts/lambda-calculus-via-csharp-4-tuple-and-signed-numeral)
        
        -   Church pair (2-tuple)
            -   Tuple operators
        -   N-tuple
        -   Signed numeral
            -   Arithmetic operators
    5.  ### [Church encoding: Function as list](/posts/lambda-calculus-via-csharp-5-list)
        
        -   Tuple as list node
            -   List operators
        -   Aggregation function as list node
            -   List operators
        -   Model everything
    6.  ### [Combinatory logic](/posts/lambda-calculus-via-csharp-6-combinatory-logic)
        
        -   Combinator
        -   SKI combinator calculus
            -   SKI compiler: compile lambda calculus expression to SKI calculus combinator
        -   Iota combinator calculus
    7.  ### [Fixed point combinator and recursion](/posts/lambda-calculus-via-csharp-7-fixed-point-combinator-and-recursion)
        
        -   Normal order fixed point combinator (Y combinator) and recursion
        -   Applicative order fixed point combinator (Z combinator) and recursion
    8.  ### [Undecidability of equivalence](/posts/lambda-calculus-via-c-sharp-24-undecidability-of-equivalence)
        
        -   Halting problem
        -   Equivalence problem
8.  ## [Category Theory via C#: The essentials and design of LINQ](/archive/?tag=Category%20Theory)
    
    1.  ### [Basics: Category and morphism](/posts/category-theory-via-csharp-1-fundamentals)
        
        -   Category and category laws
        -   DotNet category
    2.  ### [Monoid](/posts/category-theory-via-csharp-2-monoid)
        
        -   Monoid and monoid laws
        -   Monoid as category
    3.  ### [Functor and LINQ to Functors](/posts/category-theory-via-csharp-3-functor-and-linq-to-functors)
        
        -   Functor and functor laws
            -   Endofunctor
            -   Type constructor and higher-kinded type
        -   LINQ to Functors
            -   Built-in IEnumerable<> functor
            -   Functor pattern of LINQ
        -   More LINQ to Functors
    4.  ### [Natural transformation](/posts/category-theory-via-csharp-4-natural-transformation)
        
        -   Natural transformation and naturality
        -   Functor Category
            -   Endofunctor category
    5.  ### [Bifunctor](/posts/category-theory-via-csharp-5-bifunctor)
        
        -   Bifunctor
        -   Monoidal category
    6.  ### [Monoidal functor and applicative functor](/posts/category-theory-via-csharp-6-monoidal-functor-and-applicative-functor)
        
        -   Monoidal functor
            -   IEnumeable<> monoidal functor
        -   Applicative functor
            -   IEnumeable<> applicative functor
        -   Monoidal functor vs. applicative functor
        -   More Monoidal functors and applicative functors
    7.  ### [Monad and LINQ to Monads](/posts/category-theory-via-csharp-7-monad-and-linq-to-monads)
        
        -   Monad
        -   LINQ to Monads and monad laws
            -   Built-in IEnumerable<> monad
            -   Monad laws and Kleisli composition
            -   Kleisli category
            -   Monad pattern of LINQ
        -   Monad vs. monoidal/applicative functor
        -   More LINQ to Monads
    8.  ### [Advanced LINQ to Monads](/posts/category-theory-via-csharp-8-more-linq-to-monads)
        
        -   IO monad
        -   State monad
        -   Try monad
        -   Reader monad
        -   Writer monad
        -   Continuation monad