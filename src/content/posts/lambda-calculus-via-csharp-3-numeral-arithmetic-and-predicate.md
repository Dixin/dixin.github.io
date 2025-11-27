---
title: "Lambda Calculus via C# (3) Numeral, Arithmetic and Predicate"
published: 2024-11-07
description: "Anonymous functions can also model numerals and their arithmetic. In Church encoding, a natural number n is represented by a function that calls a given function for n times. This representation is ca"
image: ""
tags: [".NET", "C#", "Church Encoding", "Church Numeral", "Functional Programming", "Lambda Calculus", "LINQ via C#"]
category: ".NET"
draft: false
lang: ""
---

## \[[FP & LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

Anonymous functions can also model numerals and their arithmetic. In Church encoding, a natural number n is represented by a function that calls a given function for n times. This representation is called Church Numeral.

## Church numerals

Church numerals are defined as:

```csharp
0 := λfx.x                  ≡ λf.λx.x
1 := λfx.f x                ≡ λf.λx.f x
2 := λfx.f (f x)            ≡ λf.λx.f (f x)
3 := λfx.f (f (f x))        ≡ λf.λx.f (f (f x))
...
n := λfx.f (f ... (f x)...) ≡ λf.λx.f (f .u.. (f x)...)
```

So a Church numeral n is a [higher order function](/posts/understanding-csharp-covariance-and-contravariance-5-higher-order-functions), it accepts a function f and an argument x. When n is applied, it repeatedly applies f for n times by starting with x, and returns the result. If n is 0, f is not applied (in another word, f is applied 0 times), and x is directly returned.

```csharp
0 f x ≡ x
1 f x ≡ f x
2 f x ≡ f (f x)
3 f x ≡ f (f (f x))
...
n f x ≡ f (f (... (f x)...))
```

According to the definition of function composition:

```csharp
f (f x) ≡ (f ∘ f) x
```

This definition is equivalent to compose f for n time:

```csharp
0 := λfx.x                  ≡ λf.λx.x                   ≡ λf.λx.f0 x
1 := λfx.f x                ≡ λf.λx.f x                 ≡ λf.λx.f1 x
2 := λfx.f (f x)            ≡ λf.λx.(f ∘ f) x           ≡ λf.λx.f2 x
3 := λfx.f (f (f x))        ≡ λf.λx.(f ∘ f ∘ f) x       ≡ λf.λx.f3 x
...
n := λfx.f (f ... (f x)...) ≡ λf.λx.(f ∘ f ∘ ... ∘ f) x ≡ λf.λx.fn x
```

The partial application with f is the composition of f, so Church numeral n can be simply read as – do something n times:

```csharp
0 f ≡ f0
1 f ≡ f1
2 f ≡ f2
3 f ≡ f3
...
n f ≡ fn
```

In C#, x can be anything, so leave its type as dynamic. f can be viewed as a function accept a value x and returns something, and f can also accept its returned value again, so f is of type dynamic -> dynamic. And n’ return type is the same as f’s return type, so n returns dynamic too. As a result, n can be virtually viewed as curried function type (dynamic -> dynamic) –> dynamic -> dynamic, which in C# is represented by Func<Func<dynamic, dynamic>, Func<dynamic, dynamic>>. Similar to the C# implementation of Church Boolean, a alias Numeral can be defined:

```csharp
// Curried from (dynamic -> dynamic, dynamic) -> dynamic.
// Numeral is the alias of (dynamic -> dynamic) -> dynamic -> dynamic.
public delegate Func<dynamic, dynamic> Numeral(Func<dynamic, dynamic> f);
```

Based on the definition:

```csharp
public static partial class ChurchNumeral
{
    public static readonly Numeral
        Zero = f => x => x;

    public static readonly Numeral
        One = f => x => f(x);

    public static readonly Numeral
        Two = f => x => f(f(x));

    public static readonly Numeral
        Three = f => x => f(f(f(x)));

    // ...
}
```

Also since n f ≡ fn, n can be also implemented with composition of f:

```csharp
public static readonly Numeral
    OneWithComposition = f => f;

// Two = f => f o f
public static readonly Numeral
    TwoWithComposition = f => f.o(f);

// Three = f => f o f o f
public static readonly Numeral
    ThreeWithComposition = f => f.o(f).o(f);

// ...
```

Here the o operator is the forward composition extension method defined previously. Actually, instead of defining each number individually, Church numeral can be defined recursively by increase or decrease.

## Increase and decrease

By observing the definition and code, there are some patterns when the Church numeral increases from 0 to 3. In the definitions of Church numerals:

```csharp
0 := λf.λx.x
1 := λf.λx.f (x)
2 := λf.λx.f (f x)
3 := λf.λx.f (f (f x))
...
```

The expressions in the parenthesis can be reduced from the following function applications expressions:

```csharp
0 f x ≡ x
1 f x ≡ f x
2 f x ≡ f (f x)
...
```

With substitution, Church numerals’ definition become:

```csharp
0 := λf.λx.x
1 := λf.λx.f (0 f x)
2 := λf.λx.f (1 f x)
3 := λf.λx.f (2 f x)
...
```

This shows how the the Church numerals increases. Generally, given a Church numeral n, the next numeral n + 1 is λf.λx.f (n f x). So:

```csharp
Increase := λn.λf.λx.f (n f x)
```

In C#, this is:

```csharp
public static Func<Numeral, Numeral> 
    Increase = n => f => x => f(n(f)(x));
```

In the other way, Church numeral n is to compose f for n times:

```csharp
n f ≡ fn
```

So increasing n means to compose f for one more time:

```csharp
Increase := λn.λf.f ∘ fn ≡ λn.λf.f ∘ (n f)
```

And in C#:

```csharp
public static readonly Func<Numeral, Numeral> 
    IncreaseWithComposition = n => f => f.o(n(f));
```

To decrease a Church numeral n, when n is 0, the result is defined as 0, when n is positive, the result is n – 1. The Decrease function is more complex:

```csharp
Decrease := λn.λf.λx.n (λg.λh.h (g f)) (λv.x) Id
```

When n is 0, regarding n f ≡ fn, applying Decrease with 0 can be reduced as:

```csharp
Decrease 0
≡ λf.λx.0 (λg.λh.h (g f)) (λv.x) Id
≡ λf.λx.(λg.λh.h (g f))0 (λv.x) Id
≡ λf.λx.(λv.x) Id
≡ λf.λx.x
≡ λf.λx.f0 x
```

The last expression is the definition of 0.

When n is positive, regarding function function composition is associative, the expression n (λg.λh.h (g f)) (λu.x) can be reduced first. When n is 1, 2, 3, ...:

```csharp
1 (λg.λh.h (g f)) (λv.x)
≡ (λg.λh.h (g f))1 (λv.x)
≡ (λg.λh.h (g f)) (λv.x)
≡ λh.h ((λv.x) f)
≡ λh.h x
≡ λh.h (f0 x) 

  2 (λg.λh.h (g f)) (λv.x)
≡ (λg.λh.h (g f))2 (λv.x)
≡ (λg.λh.h (g f)) ∘ (λg.λh.h (g f))1 (λv.x)
≡ (λg.λh.h (g f)) (λh.h (f0 x))
≡ λh.h (λh.h (f0 x) f)
≡ λh.h (f (f0 x))
≡ λh.h (f1 x)

  3 (λg.λh.h (g f)) (λv.x)
≡ (λg.λh.h (g f))3 (λv.x)
≡ (λg.λh.h (g f)) ∘ (λg.λh.h (g f))2 (λv.x)
≡ (λg.λh.h (g f)) (λh.h (f1 x))
≡ λh.h ((λh.h (f1 x)) f)
≡ λh.h (f (f1 x))
≡ λh.h (f2 x)

...
```

And generally:

```csharp
n (λg.λh.h (g f)) (λv.x)
≡ λh.h (fn - 1 x)
```

So when Decrease is applied with positive n:

```csharp
Decrease n
≡ λf.λx.n (λg.λh.h (g f)) (λv.x) Id
≡ λf.λx.(λh.h (fn - 1 x)) Id
≡ λf.λx.Id (fn - 1 x)
≡ λf.λx.fn - 1 x
```

The returned result is the definition of n – 1. In the following C# implementation, a lot of noise of type information is involved to implement complex lambda expression:

```csharp
// Decrease = n => f => x => n(g => h => h(g(f)))(_ => x)(Id)
public static readonly Func<Numeral, Numeral> 
    Decrease = n => f => x => n(g => new Func<Func<dynamic, dynamic>, dynamic>(h => h(g(f))))(new Func<Func<dynamic, dynamic>, dynamic>(_ => x))(new Func<dynamic, dynamic>(Functions<dynamic>.Id));
```

Here are the actual types of the elements in above lambda expression at runtime:

-   g: (dynamic -> dynamic) -> dynamic
-   h: dynamic -> dynamic
-   g(f): dynamic
-   h(g(f)): dynamic
-   h => h(g(f)): (dynamic -> dynamic) -> dynamic
-   g => h => h(g(f)): ((dynamic -> dynamic) -> dynamic) -> (dynamic -> dynamic) -> dynamic
-   n(g => h => h(g(f))): ((dynamic -> dynamic) -> dynamic) -> (dynamic -> dynamic) -> dynamic
-   \_ => x: (dynamic -> dynamic) -> dynamic
-   n(g => h => h(g(f)))(\_ => x): (dynamic -> dynamic) -> dynamic
-   Id: dynamic -> dynamic
-   n(g => h => h(g(f)))(\_ => x)(Id): dynamic

At compile time, function types must be provided for a few elements. When n is applied, C# compiler expects its first argument g => h => h(g(f)) to be of type dynamic => dynamic. So C# compiler infers g to dynamic, but cannot infer the type of h => h(g(f)), which can be expression tree or anonymous function, so the constructor call syntax is used here to specify it is a function of type (dynamic -> dynamic) -> dynamic. Similarly, C# compiler expects n’s second argument to be dynamic, and C# compiler cannot infer the type of \_ => x, so the constructor syntax is used again for \_ => x. Also, Functions<dynamic>.Id is of Unit<dynamic> type, while at runtime a dynamic -> dynamic function is expected. Unit<dynamic> is alias of function type dynamic –> dynamic, but the conversion does not happen automatically at runtime, so the constructor syntax is used once again to indicate the function type conversion.

Later after introducing Church pair, a cleaner version of Decrease will be implemented.

## Arithmetic operators

To implement add operation, according to the definition, Church numeral a adding Church numeral b means to apply f for a times, then apply f again for b times:

```csharp
Add := λa.λb.λf.λx.b f (a f x)
```

With the definition of function composition, Add can be also defined as:

```csharp
Add := λa.λb.λf.fa ∘ fb ≡ λa.λb.λf.(a f) ∘ (b f)
```

So in C#:

```csharp
public static readonly Func<Numeral, Func<Numeral, Numeral>>  
    Add = a => b => f => x => b(f)(a(f)(x));

public static readonly Func<Numeral, Func<Numeral, Numeral>> 
    AddWithComposition = a => b => f => a(f).o(b(f));
```

With Increase function, Add can also be defined as increase a for b times:

```csharp
Add := λa.λb.b Increase a
```

In C#, there are some noise of type information again:

```csharp
public static readonly Func<Numeral, Func<Numeral, Numeral>>
    AddWithIncrease = a => b => b(Increase)(a);
```

Unfortunately, the above code cannot be compiled, because b is a function of type (dynamic -> dynamic) -> dynamic x -> dynamic. So its first argument f must be a function of type dynamic -> dynamic. Here, Increase is of type Numeral -> Numeral, and b(Increase) cannot be compiled. The solution is to eta convert Increase to a wrapper function λn.Increase n:

```csharp
Add := λa.λb.a (λn.Increase n) b
```

So that in C#:

```csharp
// Add = a => b => b(Increase)(a)
// η conversion:
// Add = a => b => b(n => Increase(n))(a)
public static readonly Func<Numeral, Func<Numeral, Numeral>>
    AddWithIncrease = a => b => b(n => Increase(n))(a);
```

Since a dynamic -> dynamic function is expected and the wrapper function n => Increase(n), n inferred to be of type dynamic. Increase(n) still returns Numeral, so the wrapper function is of type dynamic -> Numeral. Regarding dynamic is just object, and Numeral derives from object, with support covariance in C#, the wrapper function is implicitly converted to dynamic -> dynamic, so calling b with the wrapper function can be compiled.

Similarly, Church numeral a subtracting b can be defined as decrease a for b times, a multiplying b can be defined as adding a for b times to 0, and raising a to the power b can be defined as multiplying a for n times with 1:

```csharp
Subtract := λa.λb.b Decrease a
Multiply := λa.λb.b (Add a) 0
Power := λa.λb.b (Multiply a) 1
```

The C# implementation are in the same pattern:

```csharp
// Subtract = a => b => b(Decrease)(a)
// η conversion:
// Subtract = a => b => b(n => Decrease(n))(a)
public static readonly Func<Numeral, Func<Numeral, Numeral>>
    Subtract = a => b => b(n => Decrease(n))(a);

// Multiply = a => b => b(Add(a))(a)
// η conversion:
// Multiply = a => b => b(n => Add(a)(n))(Zero)
public static readonly Func<Numeral, Func<Numeral, Numeral>>
    Multiply = a => b => b(n => Add(a)(n))(Zero);

// Pow = a => b => b(Multiply(a))(a)
// η conversion:
// Pow = a => b => b(n => Multiply(a)(n))(1)
public static readonly Func<Numeral, Func<Numeral, Numeral>>
    Pow = a => b => b(n => Multiply(a)(n))(One);
```

Similar to Church Boolean operators, the above arithmetic operators can also be wrapped as extension method for convenience:

```csharp
public static partial class NumeralExtensions
{
    public static Numeral Increase(this Numeral n) => ChurchNumeral.Increase(n);

    public static Numeral Decrease(this Numeral n) => ChurchNumeral.Decrease(n);

    public static Numeral Add(this Numeral a, Numeral b) => ChurchNumeral.Add(a)(b);

    public static Numeral Subtract(this Numeral a, Numeral b) => ChurchNumeral.Subtract(a)(b);

    public static Numeral Multiply(this Numeral a, Numeral b) => ChurchNumeral.Multiply(a)(b);

    public static Numeral Pow(this Numeral mantissa, Numeral exponent) => ChurchNumeral.Pow(mantissa)(exponent);
}
```

## Predicate and relational operators

Predicate is function returning Church Boolean. For example, the following function predicate whether a Church numeral n is 0:

```csharp
IsZero := λn.n (λx.False) True
```

When n is 0, (λx.False) is not applied, and IsZero directly returns True. When n is positive, (λx.False) is applied for n times. (λx.False) always return False, so IsZero returns False. The following are the implementation and extension method:

```csharp
public static partial class ChurchPredicate
{
    public static readonly Func<Numeral, Boolean> 
        IsZero = n => n(_ => False)(True);
}

public static partial class NumeralExtensions
{
    public static Boolean IsZero(this Numeral n) => ChurchPredicate.IsZero(n);
}
```

With IsZero, it is easy to define functions to compare 2 Church numerals a and b. According the to definition of Decrease and Subtract, when a – b is 0, a is either equal to b, or less than b. So IsLessThanOrEqualTo can be defined with IsZero and Subtract:

```csharp
IsLessThanOrEqualTo := λa.λb.IsZero (Subtract a b)
```

IsGreaterThanOrEqualTo is similar:

```csharp
IsGreaterThanOrEqualTo := λa.λb.IsZero (Subtract b a)
```

Then these 2 functions can define IsEqualTo:

```csharp
IsEqualTo := λa.λb.And (IsLessThanOrEqualTo a b) (IsGreaterThanOrEqualTo a b)
```

The opposite of these functions are IsGreaterThan, IsLessThan, IsNotEqual. They can be defined with Not:

```csharp
IsGreaterThan := λa.λb.Not (IsLessThanOrEqualTo a b)
IsLessThan := λa.λb.Not (IsGreaterThanOrEqualTo a b)
IsNotEqualTo := λa.λb.Not (IsEqualTo a b)
```

The following are the C# implementation of these 6 predicates:

```csharp
public static partial class ChurchPredicate
{
    public static readonly Func<Numeral, Func<Numeral, Boolean>> 
        IsLessThanOrEqualTo = a => b => a.Subtract(b).IsZero();

    public static readonly Func<Numeral, Func<Numeral, Boolean>> 
        IsGreaterThanOrEqualTo = a => b => b.Subtract(a).IsZero();

    public static readonly Func<Numeral, Func<Numeral, Boolean>>
        IsEqualTo = a => b => IsLessThanOrEqualTo(a)(b).And(IsGreaterThanOrEqualTo(a)(b));

    public static readonly Func<Numeral, Func<Numeral, Boolean>>
        IsGreaterThan = a => b => IsLessThanOrEqualTo(a)(b).Not();

    public static readonly Func<Numeral, Func<Numeral, Boolean>> 
        IsLessThan = a => b => IsGreaterThanOrEqualTo(a)(b).Not();

    public static readonly Func<Numeral, Func<Numeral, Boolean>>
        IsNotEqualTo = a => b => IsEqualTo(a)(b).Not();
}

public static partial class NumeralExtensions
{
    public static Boolean IsLessThanOrEqualTo(this Numeral a, Numeral b) => ChurchPredicate.IsLessThanOrEqualTo(a)(b);

    public static Boolean IsGreaterThanOrEqualTo(this Numeral a, Numeral b) => ChurchPredicate.IsGreaterThanOrEqualTo(a)(b);

    public static Boolean IsEqualTo(this Numeral a, Numeral b) => ChurchPredicate.IsEqualTo(a)(b);

    public static Boolean IsGreaterThan(this Numeral a, Numeral b) => ChurchPredicate.IsGreaterThan(a)(b);

    public static Boolean IsLessThan(this Numeral a, Numeral b) => ChurchPredicate.IsLessThan(a)(b);

    public static Boolean IsNotEqualTo(this Numeral a, Numeral b) => ChurchPredicate.IsNotEqualTo(a)(b);
}
```

### Attempt of recursion

The division of natural numbers can be defined with arithmetic and relation operators:

```csharp
a / b := if a >= b then 1 + (a – b) / b else 0
```

This is a recursive definition. If defining division in this way lambda calculus, the function name is referred in its own body:

```csharp
DivideBy := λa.λb.If (IsGreaterThanOrEqualTo a b) (λx.Add One (DivideBy (Subtract a b) b)) (λx.Zero)
```

As fore mentioned, in lambda calculus, functions are anonymously by default, and names are just for readability. Here the self reference does not work with anonymous function:

```csharp
λa.λb.If (IsGreaterThanOrEqualTo a b) (λx.Add One (? (Subtract a b) b)) (λx.Zero)
```

So the above DivideBy function definition is illegal in lambda calculus. The recursion implementation with anonymous function will be discussed later in this chapter.

In C#, recursion is a basic feature, so the following self reference is supported:

```csharp
using static ChurchBoolean;

public static partial class ChurchNumeral
{
    // Divide = dividend => divisor => 
    //    If(dividend >= divisor)
    //        (_ => 1 + DivideBy(dividend - divisor)(divisor))
    //        (_ => 0);
    public static readonly Func<Numeral, Func<Numeral, Numeral>>
        DivideBy = dividend => divisor =>
            If(dividend.IsGreaterThanOrEqualTo(divisor))
                (_ => One.Add(DivideBy(dividend.Subtract(divisor))(divisor)))
                (_ => Zero);
}
```

Here using static directive is used so that ChurchBoolean.If function can be called directly. DivideBy is compiled to a field definition and field initialization code in static constructor, and apparently referencing to a field in the constructor is allowed:

```csharp
using static ChurchBoolean;
using static ChurchNumeral;

public static partial class CompiledChurchNumeral
{
    public static readonly Func<Numeral, Func<Numeral, Numeral>> DivideBySelfReference;

    static CompiledChurchNumeral()
    {
        DivideBySelfReference = dividend => divisor =>
            If(dividend.IsGreaterThanOrEqualTo(divisor))
                (_ => One.Add(DivideBySelfReference(dividend.Subtract(divisor))(divisor)))
                (_ => Zero);
    }
}
```

The self reference also works for named function:

```csharp
public static partial class ChurchNumeral
{
    public static Func<Numeral, Numeral> DivideByMethod(Numeral dividend) => divisor =>
        If(dividend.IsGreaterThanOrEqualTo(divisor))
            (_ => One.Add(DivideByMethod(dividend.Subtract(divisor))(divisor)))
            (_ => Zero);
}
```

The only exception is, when this function is a local variable instead of field, then the inline self reference cannot be compiled:

```csharp
internal static void Inline()
{
    Func<Numeral, Func<Numeral, Numeral>> divideBy = dividend => divisor =>
        If(dividend.IsGreaterThanOrEqualTo(divisor))
            (_ => One.Add(divideBy(dividend.Subtract(divisor))(divisor)))
            (_ => Zero);
}
```

The reason is, the value of the local variable is compiled before the local variable is compiled. when the anonymous function is compiled, the referenced divideBy function is not defined yet, and C# compiler gives CS0165 error: Use of unassigned local variable 'divideBy'. To resolve this problem, divideBy can be first initialized with default value null. When divideBy is initialized again with the anonymous function, it is already defined, so the lambda expression can be compiled:

```csharp
internal static void Inline()

{
    Func<Numeral, Func<Numeral, Numeral>> divideBy = null;
    divideBy = dividend => divisor =>
        If(dividend.IsGreaterThanOrEqualTo(divisor))
            (_ => One.Add(divideBy(dividend.Subtract(divisor))(divisor)))
            (_ => Zero);
}
```

The above division operator DivideBy will be used temporarily. Later after introducing fixed point combinator, the division can be implemented with an anonymous function without self reference at all.

## Conversion between Church numeral and System.UInt32

In .NET, natural number can be represented with unit (System.UInt32). It would be intuitive if Church numeral and uint can be converted to each other. Similar to the conversion between Church Boolean and bool, the following extension methods can be defined:

```csharp
public static partial class ChurchEncoding
{
    public static Numeral Church(this uint n) => n == 0U ? ChurchNumeral.Zero : Church(n - 1U).Increase();

    public static uint Unchurch(this Numeral n) => (uint)n(x => (uint)x + 1U)(0U);
}
```

Converting uint to Church numeral is recursive. When n is 0, Zero is returned directly. When n is positive, n is decreased and converted recursively. The recursion terminates when n is decreased to 0, then Increase is called for n times with Zero, and Church numeral n is calculated. And converting Church numeral n to uint just need to add 1U for n times to 0U.

The following code demonstrate how the operators and conversions work:

```csharp
[TestClass]
public partial class ChurchNumeralTests
{
    [TestMethod]
    public void IncreaseTest()
    {
        Numeral numeral = 0U.Church();
        Assert.AreEqual(0U + 1U, (numeral = numeral.Increase()).Unchurch());
        Assert.AreEqual(1U + 1U, (numeral = numeral.Increase()).Unchurch());
        Assert.AreEqual(2U + 1U, (numeral = numeral.Increase()).Unchurch());
        Assert.AreEqual(3U + 1U, (numeral = numeral.Increase()).Unchurch());
        numeral = 123U.Church();
        Assert.AreEqual(123U + 1U, numeral.Increase().Unchurch());
    }

    [TestMethod]
    public void AddTest()
    {
        Assert.AreEqual(0U + 0U, 0U.Church().Add(0U.Church()).Unchurch());
        Assert.AreEqual(0U + 1U, 0U.Church().Add(1U.Church()).Unchurch());
        Assert.AreEqual(10U + 0U, 10U.Church().Add(0U.Church()).Unchurch());
        Assert.AreEqual(0U + 10U, 0U.Church().Add(10U.Church()).Unchurch());
        Assert.AreEqual(1U + 1U, 1U.Church().Add(1U.Church()).Unchurch());
        Assert.AreEqual(10U + 1U, 10U.Church().Add(1U.Church()).Unchurch());
        Assert.AreEqual(1U + 10U, 1U.Church().Add(10U.Church()).Unchurch());
        Assert.AreEqual(3U + 5U, 3U.Church().Add(5U.Church()).Unchurch());
        Assert.AreEqual(123U + 345U, 123U.Church().Add(345U.Church()).Unchurch());
    }

    [TestMethod]
    public void DecreaseTest()
    {
        Numeral numeral = 3U.Church();
        Assert.AreEqual(3U - 1U, (numeral = numeral.Decrease()).Unchurch());
        Assert.AreEqual(2U - 1U, (numeral = numeral.Decrease()).Unchurch());
        Assert.AreEqual(1U - 1U, (numeral = numeral.Decrease()).Unchurch());
        Assert.AreEqual(0U, (numeral = numeral.Decrease()).Unchurch());
        numeral = 123U.Church();
        Assert.AreEqual(123U - 1U, numeral.Decrease().Unchurch());
    }

    [TestMethod]
    public void SubtractTest()
    {
        Assert.AreEqual(0U - 0U, 0U.Church().Subtract(0U.Church()).Unchurch());
        Assert.AreEqual(0U, 0U.Church().Subtract(1U.Church()).Unchurch());
        Assert.AreEqual(10U - 0U, 10U.Church().Subtract(0U.Church()).Unchurch());
        Assert.AreEqual(0U, 0U.Church().Subtract(10U.Church()).Unchurch());
        Assert.AreEqual(1U - 1U, 1U.Church().Subtract(1U.Church()).Unchurch());
        Assert.AreEqual(10U - 1U, 10U.Church().Subtract(1U.Church()).Unchurch());
        Assert.AreEqual(0U, 1U.Church().Subtract(10U.Church()).Unchurch());
        Assert.AreEqual(0U, 3U.Church().Subtract(5U.Church()).Unchurch());
        Assert.AreEqual(0U, 123U.Church().Subtract(345U.Church()).Unchurch());
    }

    [TestMethod]
    public void MultiplyTest()
    {
        Assert.AreEqual(0U*0U, 0U.Church().Multiply(0U.Church()).Unchurch());
        Assert.AreEqual(0U*1U, 0U.Church().Multiply(1U.Church()).Unchurch());
        Assert.AreEqual(10U*0U, 10U.Church().Multiply(0U.Church()).Unchurch());
        Assert.AreEqual(0U*10U, 0U.Church().Multiply(10U.Church()).Unchurch());
        Assert.AreEqual(1U*1U, 1U.Church().Multiply(1U.Church()).Unchurch());
        Assert.AreEqual(10U*1U, 10U.Church().Multiply(1U.Church()).Unchurch());
        Assert.AreEqual(1U*10U, 1U.Church().Multiply(10U.Church()).Unchurch());
        Assert.AreEqual(3U*5U, 3U.Church().Multiply(5U.Church()).Unchurch());
        Assert.AreEqual(12U*23U, 12U.Church().Multiply(23U.Church()).Unchurch());
    }

    [TestMethod]
    public void PowTest()
    {
        Assert.AreEqual(Math.Pow(0U, 1U), 0U.Church().Pow(1U.Church()).Unchurch());
        Assert.AreEqual(Math.Pow(10U, 0U), 10U.Church().Pow(0U.Church()).Unchurch());
        Assert.AreEqual(Math.Pow(0U, 10U), 0U.Church().Pow(10U.Church()).Unchurch());
        Assert.AreEqual(Math.Pow(1U, 1U), 1U.Church().Pow(1U.Church()).Unchurch());
        Assert.AreEqual(Math.Pow(10U, 1U), 10U.Church().Pow(1U.Church()).Unchurch());
        Assert.AreEqual(Math.Pow(1U, 10U), 1U.Church().Pow(10U.Church()).Unchurch());
        Assert.AreEqual(Math.Pow(3U, 5U), 3U.Church().Pow(5U.Church()).Unchurch());
        Assert.AreEqual(Math.Pow(5U, 3U), 5U.Church().Pow(3U.Church()).Unchurch());
    }

    [TestMethod]
    public void DivideByRecursionTest()
    {
        Assert.AreEqual(1U / 1U, 1U.Church().DivideBy(1U.Church()).Unchurch());
        Assert.AreEqual(1U / 2U, 1U.Church().DivideBy(2U.Church()).Unchurch());
        Assert.AreEqual(2U / 2U, 2U.Church().DivideBy(2U.Church()).Unchurch());
        Assert.AreEqual(2U / 1U, 2U.Church().DivideBy(1U.Church()).Unchurch());
        Assert.AreEqual(10U / 3U, 10U.Church().DivideBy(3U.Church()).Unchurch());
        Assert.AreEqual(3U / 10U, 3U.Church().DivideBy(10U.Church()).Unchurch());
    }
}
```