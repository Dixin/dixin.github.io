---
title: "JavaScript: Can document Object Be Optimized?"
published: 2007-10-25
description: "In JavaScript, document is a property of window. When access document directly, window.document is accessed. Recently, a colleague demonstrated a way to optimize document, which looks weird:"
image: ""
tags: ["HTML", "JavaScript", "Web", "XHTML"]
category: "HTML"
draft: false
lang: ""
---

In JavaScript, document is a property of window. When access document directly, window.document is accessed. Recently, a colleague demonstrated a way to optimize document, which looks weird:

```csharp
// Accessing _document might be faster than accessing document;
var _document = window.document;
```

To avoid changing context code accessing document, like document.getElementById() invocation, etc., the above code should be:

```csharp
var document = window.document;
```

However, this results an error in most browsers. There is one way to work around:

```csharp
try {
    var _document = window.document;
    eval("var document = _document");
}
catch (error) { 
}
finally {
    _document = null;
    delete _document;
}
```

And this is the test code:

```xml
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>Test document</title>
    </head>
    <body>
        <div id="testDocument">
        </div>
        <script type="text/javascript">
            var testDocument = function() {
                var start = new Date();
                for (var i = 0; i < 10000; i++) {
                    document.getElementById("testDocument");
                }
                return new Date() - start;
            }

            var time = testDocument();

            try {
                var _document = window.document;
                eval("var document = _document"); // Fails in Firefox.
            }
            catch (error) {
                // Firefox: "TypeError: Redeclareation of const document".
            }
            finally {
                _document = null;
                delete _document;
            }

            alert((testDocument() / time * 100) + "%");
        </script>
    </body>
</html>
```

The alerted message is the rate of the normal document accessing time / “optimized” document accessing time:

-   IE 6: 50%~65%;
-   IE 7: 45%~70%;
-   Firefox 2.0.0.8: Cannot work in firefox;
-   Opera 9.24: 40%~70%;
-   Safari 3.0.3: Unstable, sometimes 50%, sometimes 100%, sometimes 200%.

I am not the developer of Web browsers. If you knows how does this work, please tell me.