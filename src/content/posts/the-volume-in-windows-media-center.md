---
title: "The Volume In Windows Media Center"
published: 2010-04-11
description: "I developed a tool for  in 2008 in , and I got a very cool Windows Media Center remote controller. Sin"
image: ""
tags: ["Usability", "Windows", "Windows Media Center"]
category: "Usability"
draft: false
lang: ""
---

I developed a tool for [Windows Media Center](http://en.wikipedia.org/wiki/Windows_Media_Center) in 2008 in [Redmond](/posts/default), and I got a very cool Windows Media Center remote controller. Since then I became a fun of it. Windows Media Center + remote controller makes my [Alienware](http://en.wikipedia.org/wiki/Alienware) [M17x](http://www.dell.com/us/en/home/notebooks/laptop-alienware-m17x/pd.aspx?refid=laptop-alienware-m17x&cs=19&s=dhs) into a powerful [home theatre](http://en.wikipedia.org/wiki/Home_cinema).

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_2105FA6F.png "image")

The volume control feature might cause a usability issue because:

-   it is synchronized with Windows volume;
-   its degrees are inconsistent with Windows. In Windows, the full volume is 100, while in Windows Media Center it is 50.

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_3623DA4A.png "image")

So consider the following scenarios:

-   User need to remember: when seeing 50 in Windows volume, it means half of full volume, while 50 means full volume in Windows Media Center;
-   When user change Windows volume into X, the Windows Media Center volume is synchronized and displays the value X / 2.

I am wondering why it is necessary to design like this?