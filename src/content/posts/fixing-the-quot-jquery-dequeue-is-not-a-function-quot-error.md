---
title: "Fixing The “jQuery.dequeue is not a function” Error"
published: 2008-01-10
description: "Today when using  in , an error occured in both IE an Firefox.  displayed such error mess"
image: ""
tags: ["JavaScript", "jQuery"]
category: "JavaScript"
draft: false
lang: ""
---

Today when using [interface](http://interface.eyecon.ro/) in [WebOS](http://www.coolwebos.com/), an error occured in both IE an Firefox. [Firebug](http://www.getfirebug.com/) displayed such error message: jQuery.dequeue is not a function.

This is because interface is a plug-in for [jQuery](http://www.jquery.com) 1.1. By checking the [source code](http://interface.eyecon.ro/interface/interface_1.2.zip), it invoked the legacy version of the jQuery.dequeue() method. To work with the latest jQuery, all the invocation code need to be changed. For example:

-   ifx.js, line 472: jQuery.dequeue(elem, "fx") should be jQuery(elem).dequeue("fx");
-   ifxtransfer.js, line 120: jQuery.dequeue(z.el.get(0), 'interfaceFX') should be jQuery(z.el.get(0)).dequeue('interfaceFX');

etc.