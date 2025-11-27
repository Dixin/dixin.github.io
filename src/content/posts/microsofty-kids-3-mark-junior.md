---
title: "Microsofty Kids Around (3) Mark Junior"
published: 2009-10-13
description: "Actually this baby is not so Microsofty currently, but his father  is so Microsoftily crazy, so everyone believes that he will become so very soon."
image: ""
tags: ["Microsoft"]
category: "Microsoft"
draft: false
lang: ""
---

Actually this baby is not so Microsofty currently, but his father [Mark](http://www.markzhou.com/blog/) is so Microsoftily crazy, so everyone believes that he will become so very soon.

![mark-junior-1](https://aspblogs.z22.web.core.windows.net/dixin/Media/markjunior1_44DC3115.jpg "mark-junior-1")

![mark-junior-2](https://aspblogs.z22.web.core.windows.net/dixin/Media/markjunior2_28EAFC1D.jpg "mark-junior-2")

His father, Mark, was an excellent developer / development lead of Microsoft projects, as well as my buddy. [We discuss a lot of things](http://fastdev.spaces.live.com/blog/cns!8A0406089AAD8752!1126.entry) about him. And here are the conclusions:

-   His father complained that, according to [my post](/posts/csharp-coding-guidelines-3-members), constructor is better to be lightweight, but his constructor is not so well and ran for 280 days…
-   Some properties or behaviors were override from parents, which would possibly break [Liskov substitution principle](http://en.wikipedia.org/wiki/Liskov_substitution_principle).
-   Obvious [side effects](http://en.wikipedia.org/wiki/Side_effect_\(computer_science\)), like making parents very nervous and tried, etc.
-   Resource costly. A large quantity of resource exhausted to construct just one instance.
-   He is not covariant or contravariant.
-   He implements neither System.IComparable nor System.IComparable<T>. We cannot compare him with the other guys’ babies.
-   He is not [atomic](http://www.cnblogs.com/dixin/archive/2009/10/08/csharp-coding-guidelines-4-type.html). He can change during the runtime. I think he is more like the dynamic object in .NET 4.0, supporting late bindings of behaviors.

I suggest his parents to implement this interface for him:
```
public interface IAffluent
{
    void GetGiftAround(decimal money);
}
```

Finally we discussed the variant relationship of the stealing stuff behavior and stealing drink behavior:

```csharp
// Stuff is the base class of Drink.
internal class Drink : object
{
}

internal class Program
{
    // The behavior of stealing stuff.
    private static void StealStuff(object stuff)
    {
    }

    // The behavior of stealing Drink.
    private static void StealDrink(Drink drink)
    {
    }

    private static void Main()
    {
        Action<Drink> stealDrink = StealDrink;
        Action<object> stealStuff = StealStuff;

        // Contravariance.
        Action<Drink> contralvariance = StealStuff;
    }
}
```
[](http://11011.net/software/vspaste)You can see more details about variances in [my posts](/posts/understanding-csharp-covariance-and-contravariance-1-delegates). And you can see more photos of the baby [here](https://cid-8a0406089aad8752.skydrive.live.com/browse.aspx/.res/8a0406089aad8752!1113?ct=photos).