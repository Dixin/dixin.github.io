---
title: "A Simple CSS hack"
published: 2007-09-21
description: "This following hack works for IE6 / IE7 / Firefox:"
image: ""
tags: ["CSS", "Web"]
category: "CSS"
draft: false
lang: ""
---

This following hack works for IE6 / IE7 / Firefox:
```
.some-class
{
    color: #FF0000 !important; /* For firefox, safari and opera */
    color: #00FF00; /* For ie6 */
}

*html .some-class
{
    color: #0000FF; /* For ie7 */
}
```
[](http://11011.net/software/vspaste)