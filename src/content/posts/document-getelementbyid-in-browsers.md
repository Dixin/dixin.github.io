---
title: "document.getElementById() In Browsers"
published: 2007-10-26
description: "For non-form elements, like <div>, etc., document.getElementById() usually works stably, except Opera:"
image: ""
tags: ["HTML", "JavaScript", "Web", "XHTML"]
category: "Web"
draft: false
lang: ""
---

For non-form elements, like <div>, etc., document.getElementById() usually works stably, except Opera:

```html
<div name="userName">1</div>
<div id="userName">2</div>
<script type="text/javascript">
    alert(document.getElementById("userName").innerHTML);
</script>
```

Opera also checks name attribute, so the alerted message is “1”.

For form elements, IE and Opera have the same behavior:

```html
<input type="text" name="userName" value="1" />
<input type="text" id="userName" value="2" />
<script type="text/javascript">
    alert(document.getElementById("userName").value);
</script>
```

Here IE and Opera alerts “1”.

Actually:

-   IE 6: Also checks name for form elements;
-   IE 7: The same as IE 6;
-   Firefox 2.0.0.8: Normal;
-   Opera 9.24: Also checks name for any elements;
-   Safari 3.0.3: Normal.

For complex web pages, it would be good if there is a spec for elements naming.