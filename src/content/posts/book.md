---
title: "Functional Programming and LINQ via C#"
published: 2019-02-19
description: "C#, .NET Core, Azure, Functional Programming, Lambda Calculus, Category Theory, LINQ, LINQ to Objects, LINQ to XML, Parallel LINQ, LINQ to Entities, Entity Framework Core, Azure SQL Database."
image: ""
tags: ["C#", ".NET", ".NET Core", "LINQ"]
category: "C#"
draft: false
lang: ""
---

### \[Latest version: [https://weblogs.asp.net/dixin/linq-via-csharp](/posts/linq-via-csharp)\]

### Keywords

C#, .NET Core, Azure, Functional Programming, Lambda Calculus, Category Theory, LINQ, LINQ to Objects, LINQ to XML, Parallel LINQ, LINQ to Entities, Entity Framework Core, Azure SQL Database.

### Abstract

This is a latest, in-depth, cross-platform book on functional programming and LINQ programming via C# language. It discusses:

-   Elegant functional programming via C#
-   Use functional LINQ to work with local data, and cloud data in Azure SQL Database
-   The internal implementation and underlying mathematics theories

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

1.  ## Functional programming and LINQ paradigm
    
    1.  ### [Getting started with .NET/Core, C# and LINQ](/posts/linq-via-csharp-introduction-7)
        
        -   Cross platform .NET, C# and LINQ
            -   .NET Framework
            -   Parallel LINQ
            -   .NET Core, UWP, Mono, Xamarin and Unity
            -   .NET Standard
            -   C# functional programming
        -   This tutorial
        -   Author
        -   Code examples
        -   Start coding
            -   Start coding with Visual Studio (Windows)
            -   Start coding with Visual Studio Code (Windows, macOS and Linux)
            -   Start coding with Visual Studio for Mac (macOS)
    2.  ### [Programming paradigms and functional programming](/posts/introducing-linq-3-waht-is-functional-programming-7)
        
        -   Programming paradigms
        -   Imperative programming vs. declarative programming
        -   Object-oriented programming vs. functional programming
    3.  ### [LINQ Overview](/posts/introducing-linq-2-what-is-linq-7)
        
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
        -   Productivity
        -   Local query vs. remote query
2.  ## Functional programming in-depth
    
    1.  ### [C# language fundamentals](/posts/functional-csharp-fundamentals-7)
        
        -   Types and members
            -   Built-in types
        -   Reference type vs. value type
            -   default literal expression
            -   ref structure
        -   Static class
        -   Partial type
        -   Interface and implementation
            -   IDisposable interface and using statement
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
    2.  ### [Named Function and function polymorphism](/posts/functional-csharp-function-type-and-delegate-7)
        
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
    3.  ### [Local function and closure](/posts/functional-csharp-local-function-and-closure-7)
        
        -   Local function
        -   Closure
            -   Outer variable
            -   Implicit reference
    4.  ### [Function input and output](/posts/functional-csharp-function-parameter-and-return-value-7)
        
        -   Pass by value vs. pass by reference (ref parameter)
            -   Pass by read only reference (in parameter)
        -   Output parameter (out parameter) and out variable
        -   Parameter array
        -   Positional argument vs. named argument
        -   Required parameter vs. optional parameter
        -   Caller information parameter
        -   Return by value vs. return by reference
            -   Return by read only reference
    5.  ### [Delegate: function type, instance, and group](/posts/functional-csharp-local-function-and-closure-7)
        
        -   Delegate type as function type
            -   Function type
            -   Generic delegate type
            -   Unified built-in delegate types
        -   Delegate instance as function instance
            -   Delegate class and delegate instance
        -   Delegate instance as function group
            -   Event and event handler
    6.  ### [Anonymous function and lambda expression](/posts/functional-csharp-anonymous-function-and-lambda-expression-7)
        
        -   Anonymous method
        -   Lambda expression
        -   Call anonymous function
        -   Closure
        -   Expression bodied function member
    7.  ### [Expression tree: Function as data](/posts/functional-csharp-function-as-data-and-expression-tree-7)
        
        -   Lambda expression as expression tree
            -   Code as data
            -   .NET expressions
        -   Compile expression tree at runtime
            -   Traverse expression tree
            -   Expression tree to CIL at runtime
            -   Expression tree to executable function at runtime
        -   Expression tree and LINQ remote query
    8.  ### [Higher-order function, currying and first class function](/posts/functional-csharp-higher-order-function-currying-and-first-class-function-7)
        
        -   First order and higher-order function
        -   Curry function
        -   \=> associativity
        -   Partial apply function
        -   Uncurry function
        -   First-class function
    9.  ### [Function composition and chaining](/posts/functional-csharp-function-composition-and-method-chaining-7)
        
        -   Forward and backward composition
        -   Forward pipe
        -   Fluent chaining
            -   Fluent extension methods
        -   LINQ query method composition
    10.  ### [LINQ query Expression](/posts/functional-csharp-query-expression-7)
         
         -   Syntax and compilation
         -   Query expression pattern
         -   LINQ query expression
         -   Query expression vs. query method
    11.  ### [Covariance and contravariance](/posts/functional-csharp-covariance-and-contravariance-7)
         
         -   Non-generic function type
         -   Generic function type
         -   Generic interface
         -   Generic higher-order function type
         -   Array
         -   Variances in .NET and LINQ
    12.  ### [Immutability, anonymous type and tuple](/posts/functional-csharp-immutability-anonymous-type-and-tuple-7)
         
         -   Immutable value
             -   Constant
             -   using statement and foreach statement
             -   this reference for class
             -   Function’s readonly parameter and readonly return
             -   Local variable by readonly reference (ref readonly variable)
             -   Immutable value in LINQ query expression
         -   Immutable state (immutable data type)
             -   Type with constant field
             -   Immutable class with readonly instance field
             -   Immutable structure (readonly structure)
             -   Immutable anonymous type
             -   Immutable tuple vs. mutable tuple
                 -   Construction and element name
                 -   Deconstruction
                 -   Tuple assignment
             -   Immutable collection vs. readonly collection
    13.  ### [Pure function](/posts/functional-csharp-pure-function-7)
         
         -   Referential transparency and side effect free
         -   PureAttribute and code contracts
         -   Purity in .NET
    14.  ### [Asynchronous function](/posts/functional-csharp-asynchronous-function-7)
         
         -   Task, Task<TResult> and asynchrony
         -   Named async function
         -   Awaitable-awaiter pattern
         -   Async state machine
         -   Generalized async return type and async method builder
             -   ValueTask<TResult> and performance
         -   Runtime context capture
         -   Anonymous async function
    15.  ### [Pattern matching](/posts/functional-csharp-pattern-matching-7)
         
         -   Is expression
         -   Switch statement
3.  ## LINQ to Objects: Querying objects in memory
    
    1.  ### [Local Sequential LINQ query](/posts/linq-to-objects-local-sequential-query-7)
        
        -   Iteration pattern and foreach statement
        -   IEnumerable<T> and IEnumerator<T>
            -   EnumerableAssert utility
            -   foreach loop vs. for loop
            -   Non-generic sequence vs. generic sequence
        -   LINQ to Objects queryable types
    2.  ### [LINQ to Objects standard queries and query expressions](/posts/linq-to-objects-query-methods-operators-and-query-expressions-7)
        
        -   Return a new IEnumerable<T> sequence
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
        -   Return a new collection
            -   Conversion: ToArray, ToList, ToDictionary, ToLookup
        -   Return a single value
            -   Element: First, FirstOrDefault, Last, LastOrDefault, ElementAt, ElementAtOrDefault, Single, SingleOrDefault
            -   Aggregation: Aggregate, Count, LongCount, Min, Max, Sum, Average
            -   Quantifier: All, Any, Contains
            -   Equality: SequenceEqual
        -   Queries in other languages
    3.  ### [Generator](/posts/linq-to-objects-generator-7)
        
        -   Implement iterator pattern
        -   Generate sequence and iterator
        -   Yield statement and generator
        -   Iterator and generator in other languages
    4.  ### [Deferred execution, lazy evaluation and eager Evaluation](/posts/linq-to-objects-deferred-execution-lazy-evaluation-and-eager-evaluation-7)
        
        -   Deferred execution vs. immediate execution
            -   Cold IEnumerable<T> vs. hot IEnumerable<T>
        -   Lazy evaluation vs. eager evaluation
    5.  ### [LINQ to Objects internals: Standard queries implementation](/posts/linq-to-objects-query-methods-implementation-7)
        
        -   Argument check and deferred execution
        -   Return a new collection
            -   Conversion: ToArray, ToList, ToDictionary, ToLookup
        -   Return a new IEnumerable<T> sequence
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
        -   Return a single value
            -   Element: First, FirstOrDefault, Last, LastOrDefault, ElementAt, ElementAtOrDefault, Single, SingleOrDefault
            -   Aggregation: Aggregate, Count, LongCount, Min, Max, Sum, Average
            -   Quantifier: All, Any, Contains
            -   Equality: SequenceEqual
    6.  ### [Microsoft Interactive Extensions (Ix): More powerful queries](/posts/linq-to-objects-interactive-extensions-ix-7)
        
        -   Returns a new IEnumerable<T> sequence
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
        -   Returns void
            -   Iteration: ForEach
        -   Returns a single value
            -   Aggregation: Min, Max, MinBy, MaxBy
            -   Quantifiers: isEmpty
    7.  ### [Building custom queries](/posts/linq-to-objects-custom-query-methods-7)
        
        -   Returns a new IEnumerable<T> sequence (deferred execution)
            -   Generation: Create, RandomInt32, RandomDouble, FromValue, FromValues, EmptyIfNull
            -   Filtering: Timeout
            -   Concatenation: Join, Append, Prepend, AppendTo, PrependTo
            -   Partitioning: Subsequence
            -   Exception: Catch, Retry
            -   Comparison: OrderBy, OrderByDescending, ThenBy, ThenByDescending, GroupBy, Join, GroupJoin, Distinct, Union, Intersect, Except
            -   List: Insert, Remove, RemoveAll, RemoveAt
        -   Returns a new collection
            -   Comparison: ToDictionary, ToLookup
        -   Returns a single value
            -   List: IndexOf, LastIndexOf
            -   Aggregation: PercentileExclusive, PercentileInclusive, Percentile
            -   Quantifiers: IsNullOrEmpty, IsNotNullOrEmpty
            -   Comparison: Contains, SequenceEqual
        -   Returns void
            -   Iteration: ForEach
4.  ## LINQ to XML: Querying XML
    
    1.  ### [Modeling XML](/posts/linq-to-xml-1-modeling-xml-7)
        
        -   Imperative vs. declarative paradigm
        -   Types, conversions and operators
        -   Read and deserialize XML
        -   Serialize and write XML
        -   Deferred construction
    2.  ### [LINQ to XML standard queries](/posts/linq-to-xml-2-query-methods-7)
        
        -   Navigation
        -   Ordering
        -   Comparison
        -   More useful queries
        -   XPath
        -   Generate XPath expression
    3.  ### [Manipulating XML](/posts/linq-to-xml-3-manipulating-xml-7)
        
        -   Clone
        -   Add, replace, delete, update, and events
        -   Annotation
        -   Validate with XSD
        -   Transform
5.  ## Parallel LINQ: Querying objects in parallel
    
    1.  ### [Parallel LINQ query and visualization](/posts/parallel-linq-1-local-parallel-query-and-visualization-7)
        
        -   Parallel LINQ classes and methods
        -   Parallel query vs. sequential query
        -   Execute parallel query
        -   Visualize parallel query execution
            -   Install and configure Concurrency Visualizer
            -   Visualize sequential and parallel LINQ queries
            -   Visualize chaining query methods
    2.  ### [Parallel LINQ internals: data partitioning](/posts/parallel-linq-2-partitioning-7)
        
        -   Partitioning algorithms and load balancing
            -   Range partitioning
            -   Stripped partitioning
            -   Hash partitioning
            -   Chunk partitioning
        -   Implement custom partitioner
            -   Static partitioner
            -   Dynamic partitioner
    3.  ### [Parallel LINQ standard queries](/posts/parallel-linq-3-query-methods-7)
        
        -   Query settings
            -   Cancellation
            -   Degree of parallelism
            -   Execution mode
            -   Merge the values
        -   Ordering
            -   Control the order
            -   Order and correctness
            -   Orderable partitioner
        -   Aggregation
            -   Commutativity, associativity and correctness
            -   Partition and merge
    4.  ### [Parallel query performance](/posts/parallel-linq-4-performance-7)
        
        -   Sequential vs. parallel
        -   CPU bound vs. IO bound
        -   Summary
6.  ## Entity Framework/Core and LINQ to Entities: Querying relational data
    
    1.  ### [Remote LINQ query](/posts/entity-framework-core-and-linq-to-entities-1-remote-query-7)
        
        -   Entity Framework and Entity Framework Core
        -   SQL database
        -   Remote query vs. local query
        -   Function vs. expression tree
    2.  ### [Modeling database: Object-Relational Mapping](/posts/entity-framework-core-and-linq-to-entities-2-modeling-database-object-relational-mapping-7)
        
        -   Data types
        -   Database
            -   Connection resiliency and execution strategy
        -   Tables
        -   Relationships
            -   One-to-one
            -   One-to-many
            -   Many-to-many
        -   Inheritance
        -   Views
        -   Stored procedures and functions
    3.  ### [Logging and tracing LINQ to Entities queries](/posts/entity-framework-core-and-linq-to-entities-3-logging-and-tracing-queries-7)
        
        -   Application side logging
        -   Database side tracing with Extended Events
    4.  ### [LINQ to Entities standard queries](/posts/entity-framework-core-and-linq-to-entities-4-query-methods-7)
        
        -   Return a new IQueryable<T> source
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
        -   Return a single value
            -   Element: First, FirstOrDefault, Single, SingleOrDefault
            -   Aggregation: Count, LongCount, Min, Max, Sum, Average
            -   Quantifier: All, Any, Contains
    5.  ### [LINQ to Entities internals: Query translation implementation](/posts/entity-framework-core-and-linq-to-entities-5-query-translation-implementation-7)
        
        -   Code to LINQ expression tree
            -   IQueryable<T> and IQueryProvider
            -   Queryable methods
            -   Build LINQ to Entities abstract syntax tree
        -   .NET expression tree to database expression tree
            -   Database query abstract syntax tree
            -   Compile LINQ expressions to database expressions
            -   Compile LINQ query method calls
            -   Compile .NET API calls
            -   Remote API call vs. local API call
            -   Compile database function call
        -   Database expression tree to SQL
            -   SQL generator and SQL command
            -   Generate SQL from database expression tree
    6.  ### [Loading query data](/posts/entity-framework-core-and-linq-to-entities-6-query-data-loading-7)
        
        -   Deferred execution
            -   Iterator pattern
            -   Lazy evaluation vs. eager evaluation
        -   Explicit loading
        -   Eager loading
        -   Lazy loading
            -   The N + 1 problem
            -   Disable lazy loading
    7.  ### [Manipulating relational data: Data change and transaction](/posts/entity-framework-core-and-linq-to-entities-7-data-changes-and-transactions-7)
        
        -   Repository pattern and unit of work pattern
        -   Track entities and changes
            -   Track entities
            -   Track entity changes and property changes
            -   Track relationship changes
            -   Enable and disable tracking
        -   Change data
            -   Create
            -   Update
            -   Delete
        -   Transaction
            -   Transaction with connection resiliency and execution strategy
            -   EF/Core transaction
            -   ADO.NET transaction
            -   Transaction scope
    8.  ### [Resolving optimistic concurrency](/posts/entity-framework-core-and-linq-to-entities-8-optimistic-concurrency-7)
        
        -   Detect concurrent conflicts
        -   Resolve concurrent conflicts
            -   Retain database values (database wins)
            -   Overwrite database values (client wins)
            -   Merge with database values
        -   Save changes with concurrent conflict handling
    9.  ### [Performance](/posts/entity-framework-core-and-linq-to-entities-9-performance-7)
        
        -   Initialization
            -   Provider initialization
            -   Database initialization
            -   Mapping views initialization
        -   Cache
            -   Entity cache
            -   LINQ query translation cache
            -   SQL query plan cache
        -   Asynchrony
            -   Asynchronous data queries and data changes
            -   Transactions and connection resiliency with asynchronous operations
            -   Asynchronous concurrent conflicts
7.  ## Lambda Calculus via C#: The foundation of all functional programming
    
    1.  ### [Fundamentals - Closure, Currying and Partial Application](/posts/lambda-calculus-via-c-sharp-1-fundamentals-closure-currying-and-partial-application)
        
        -   About lambda calculus (λ-calculus)
        -   Closure
        -   Currying and partial application
        -   Uncurry
        -   \=> associativity
    2.  ### [Fundamentals - Lambda Expression, Variables, Reductions](/posts/lambda-calculus-via-c-sharp-2-fundamentals-lambda-expression-variables-reductions)
        
        -   Lambda expression
        -   Bound and free variables
        -   Reductions
            -   α-conversion / alpha-conversion
            -   β-reduction / beta-reduction
            -   η-conversion / eta-conversion
    3.  ### [Fundamentals - Function composition](/posts/lambda-calculus-via-c-sharp-3-fundamentals-function-composition)
        
        -   Function composition
            -   Built-in operator in other languages
        -   Properties
            -   Associativity
            -   Unit
    4.  ### [Encoding Church Booleans](/posts/lambda-calculus-via-c-sharp-4-encoding-church-booleans)
        
        -   Church encoding
        -   Church Booleans - True and False
        -   Unit test
    5.  ### [Boolean Logic](/posts/lambda-calculus-via-c-sharp-5-boolean-logic)
        
        -   And
        -   Or
        -   Not
        -   Xor
        -   Conversion between Church Boolean and System.Boolean
        -   Unit Tests
    6.  ### [If Logic, And Reduction Strategies](/posts/lambda-calculus-via-c-sharp-6-if-logic-and-reduction-strategies)
        
        -   The first If
        -   Reduction strategies
            -   Normal order
            -   Applicative order
        -   Make If lazy
        -   Unit tests
    7.  ### [Encoding Church Numerals](/posts/lambda-calculus-via-c-sharp-7-encoding-church-numerals)
        
        -   Church numerals
        -   C# Implementation - starting from 0
    8.  ### [Church Numeral Arithmetic](/posts/lambda-calculus-via-c-sharp-8-church-numeral-arithmetic)
        
        -   Increase
        -   Add
        -   Decrease and subtract
    9.  ### [Wrapping Church Numerals And Arithmetic](/posts/lambda-calculus-via-c-sharp-9-wrapping-church-numerals-and-arithmetic)
        
        -   Non-generic wrapper for Numeral<T>, and Increase
        -   Add
        -   Decrease and Subtract
        -   Multiply and Pow
        -   Divide?
    10.  ### [Church Numeral Arithmetic Operators](/posts/lambda-calculus-via-c-sharp-10-church-numeral-arithmetic-operators)
         
         -   Operators
         -   Conversion between Church numeral (now \_Numeral) and System.UInt32
         -   Compare \_Numeral and System.UInt32
    11.  ### [Predicates, And Divide](/posts/lambda-calculus-via-c-sharp-11-predicates-and-divide)
         
         -   Predicates
         -   Divide
    12.  ### [Church Numeral Comparison Operators](/posts/lambda-calculus-via-c-sharp-12-church-numeral-comparison-operators)
         
         -   Church Numeral Comparison Operators
             -   C# object equality
         -   Unit tests
    13.  ### [Encoding Church Pairs (2-Tuples) and Generic Church Booleans](/posts/lambda-calculus-via-c-sharp-13-encoding-church-pairs-2-tuples-and-generic-church-booleans)
         
         -   Church pair (2-tuple)
         -   Generic Church Booleans
             -   Back to Church Boolean - why not using generic Church Booleans from the beginning?
         -   Currying and type inference
    14.  ### [Church Pair (2-Tuple) and Church Numeral Decrease](/posts/lambda-calculus-via-c-sharp-14-church-pair-2-tuple-and-church-numeral-decrease)
         
         -   Shift a Church Pair (2-Tuple)
         -   Decrease a Church numeral
         -   Unit tests
    15.  ### [Encoding Church List with Church Pair, And Null](/posts/lambda-calculus-via-c-sharp-15-encoding-church-list-with-church-pair-and-null)
         
         -   Church pair as a Church list node
         -   Encoding Null, and IsNull predicate
         -   Church Boolean as Null
         -   The improved Next
         -   Index
         -   Unit tests
    16.  ### [Encoding Church List with 2 Church Pairs as a Node](/posts/lambda-calculus-via-c-sharp-16-encoding-church-list-with-2-church-pairs-as-a-node)
         
         -   IsNull and Null
         -   Create, Value, and Next
         -   Index
         -   Unit tests
    17.  ### [Encoding Church List with Fold (Aggregate) Function](/posts/lambda-calculus-via-c-sharp-17-encoding-church-list-with-fold-aggregate-function)
         
         -   ListNode and wrapper
         -   IsNull
         -   Create, value and Next
         -   Index
         -   Unit tests
    18.  ### [Encoding Signed Number](/posts/lambda-calculus-via-c-sharp-18-encoding-signed-number)
         
         -   Create Signed number from Church numeral
         -   Format with 0
         -   Arithmetic
         -   Unit tests
    19.  ### [Church Encoding, And More](/posts/lambda-calculus-via-c-sharp-19-church-encoding-and-more)
         
         -   Summary of church encoding
             -   Boolean
             -   Numeral
             -   Predicate
             -   Pair (2-tuple)
             -   List
             -   Signed number
         -   Encode, encode, and encode<
             -   From signed number to complex integer and rational number
             -   From rational number to real number and complex number
             -   And much more/li>
    20.  ### [Combinators](/posts/lambda-calculus-via-c-sharp-20-combinators)
         
         -   I Combinator
         -   BCKW combinators
         -   ω combinator
         -   SKI combinators
             -   Boolean in SKI, and type issue
    21.  ### [SKI Combinator Calculus](/posts/lambda-calculus-via-c-sharp-21-ski-combinator-calculus)
         
         -   I Combinator
         -   BCKW combinators
         -   ω combinator
         -   Function composition
         -   Booleans
         -   Numerals
         -   Unit tests
    22.  ### [Iota Combinator and Jot Combinators](/posts/lambda-calculus-via-c-sharp-22-iota-combinator)
         
         -   Language with 1 element
         -   Completeness
         -   Unit tests
    23.  ### [Y Combinator, And Divide](/posts/lambda-calculus-via-c-sharp-23-y-combinator-and-divide)
         
         -   Fix point
         -   Fixed point combinator
         -   Recursion
             -   Example – Fibonacci
         -   DivideBy
         -   Unit tests
8.  ## Category Theory via C#: The essentials and design of LINQ
    
    1.  ### [Fundamentals - Category, Object And Morphism](/posts/category-theory-via-c-sharp-1-fundamentals-category-object-and-morphism)
        
        -   Category and category laws
        -   The .NET category and morphism
    2.  ### [Monoid](/posts/category-theory-via-c-sharp-2-monoid)
        
        -   Monoid and monoid laws
        -   C#/.NET monoids
            -   Void and Unit monoids
            -   More examples
        -   Nullable<T> monoid
        -   Unit tests
    3.  ### [Monoid as Category](/posts/category-theory-via-c-sharp-3-monoid-as-category)
        
        -   One monoid, one category
        -   Category laws, and unit tests
    4.  ### [Functor And IEnumerable<>](/posts/category-theory-via-c-sharp-4-functor-and-ienumerable)
        
        -   Functor and functor laws
        -   C#/.NET functors
            -   Endofunctor
            -   Kind issue of C# language/CLR
            -   The built-in IEnumerable<> functor
        -   Functor pattern of LINQ
        -   IEnumerable<>, functor laws, and unit tests
    5.  ### [More Functors: Lazy<>, Func<> And Nullable<>](/posts/category-theory-via-c-sharp-5-more-functors-lazy-func-and-nullable)
        
        -   Lazy<> functor
        -   Func<> functor
            -   Fun< , > functor
        -   Nullable<> functor
        -   Functor laws, laziness, and unit tests
    6.  ### [Functor-like Tuple<>, Task<> And IQueryable<>](/posts/category-theory-via-c-sharp-6-functor-like-tuple-task-and-iqueryable)
        
        -   Tuple<> is like a functor
            -   Tuple< , > is also like a functor
        -   Laziness vs. eagerness
        -   Task<T> is like a functor too
        -   Purity vs. impurity
            -   Purity and category theory
            -   Purity and .NET
        -   Purity, laziness and LINQ
            -   Functor vs. functor-like
        -   IQueryable<> is also like a functor
        -   Hot task vs. cold task, and unit tests
    7.  ### [Natural Transformation](/posts/category-theory-via-c-sharp-7-natural-transformation)
        
        -   Natural transformation
        -   Natural transformations for LINQ
        -   More LINQ to Monads
    8.  ### [Functor Category](/posts/category-theory-via-c-sharp-8-functor-category)
        
        -   Functor Category
        -   Endofunctor category
        -   Monoid laws for endofunctor category, and unit tests
    9.  ### [Bifunctor](/posts/category-theory-via-c-sharp-9-bifunctor)
        
        -   Bifunctor
        -   C#/.NET bifunctor
        -   Unit tests
    10.  ### [Monoidal Category](/posts/category-theory-via-c-sharp-10-monoidal-category)
         
         -   Monoidal category
         -   DotNet category is monoidal category
    11.  ### [Monoidal Functor And IEnumerable<>](/posts/category-theory-via-c-sharp-11-monoidal-functor-and-ienumerable)
         
         -   Monoidal functor
         -   C#/.NET lax monoidal endofunctors
         -   IEnumerable<> monoidal functor
             -   N-arity selector for functor
             -   Binary vs. Apply
         -   Monoidal functor and LINQ
         -   Applicative functor
         -   Applicative laws, and unit tests
    12.  ### [More Monoidal Functors: Lazy<>, Func<> And Nullable<>](/posts/category-theory-via-c-sharp-12-more-monoidal-functors-lazy-func-and-nullable)
         
         -   Lazy<> monoidal functor
         -   Func<> monoidal functor
         -   Nullable<> monoidal functor
         -   Unit tests
    13.  ### [Monoidal Functor-like Tuple<> And Task<>](/posts/category-theory-via-c-sharp-13-monoidal-functor-like-tuple-and-task)
         
         -   Tuple<>: lack of laziness
         -   Task<>: lack of purity
         -   Unit tests
    14.  ### [Monad And IEnumerable<>](/posts/category-theory-via-c-sharp-14-monad-and-ienumerable)
         
         -   Monad and monad laws
         -   C#/.NET monads
         -   IEnumerable<> monad and SelectMany
             -   IEnumerable<> monad (SelectMany) is monoid
             -   IEnumerable<> monad (SelectMany) is monoidal functor
             -   IEnumerable<> monad (SelectMany) is functor
         -   Monad pattern of LINQ
         -   Monad laws, and unit test
    15.  ### [IEnumerable<> Monad And LINQ: SelectMany For All](/posts/category-theory-via-c-sharp-15-ienumerable-monad-and-linq-selectmany-for-all)
         
         -   Query methods implemented by SelectMany
         -   Query methods in LINQ syntax
         -   Unit tests
    16.  ### [More Monads: Lazy<>, Func<>, Nullable<>, ParallelQuery<> And IObservale<>](/posts/category-theory-via-c-sharp-16-more-monads-lazy-func-nullable-parallelquery-and-iobservale)
         
         -   Lazy<> monad
         -   Func<> monad
         -   Nullable<> monad
         -   ParallelQuery<> monad
         -   IObservable<> monad
         -   Unit tests
    17.  ### [Monad-like Tuple<>, Task<>, IQueryable<> And IQbservable<>](/posts/category-theory-via-c-sharp-17-monad-like-tuple-task-iqueryable-and-iqbservable)
         
         -   Tuple<>: lack of laziness
         -   Task<>: lack of purity
             -   Task<> and LINQ
             -   Non-generic Task
         -   IQueryable<> is like a monad
         -   IQbservable<> is also like a monad
         -   Unit tests
    18.  ### [More Monad: IO<> Monad](/posts/category-theory-via-c-sharp-18-more-monad-io-monad)
         
         -   IO<T> and impurity
         -   IO<> monad
         -   Monad laws, and unit tests
    19.  ### [More Monad: State< , > Monad](/posts/category-theory-via-c-sharp-19-more-monad-state-monad)
         
         -   C#/.NET state machines
         -   State pattern in object-oriented programming
         -   State<> monad
         -   Monad laws, and unit tests
    20.  ### [More Monad: Reader< , > Monad](/posts/category-theory-via-c-sharp-20-more-monad-reader-monad)
         
         -   Reader< , > Monad
         -   Monad laws, and unit tests
    21.  ### [More Monad: Writer< , > Monad](/posts/category-theory-via-c-sharp-21-more-monad-writer-monad)
         
         -   Writer< , > monad
         -   Monad laws, and unit tests
    22.  ### [More Monad: Continuation Monad](/posts/category-theory-via-c-sharp-22-more-monad-continuation-monad)
         
         -   Continuation and continuation-passing style
         -   Continuation monad
         -   Monad laws, and unit tests
    23.  ### [Performance](/posts/category-theory-via-c-sharp-23-knowing-the-cost)
         
         -   Functional and purely functional
         -   Cost of functional and monad
         -   Cost of lambda
         -   Conclusion