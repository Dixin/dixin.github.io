---
title: "Use Fiddler with Node.js"
published: 2016-02-22
description: ") is an useful HTTP proxy debugger on Windows. It would be nice if it can work with  applica"
image: ""
tags: ["Fiddler", "HTTP", "JavaScript", "Node.js", "Web"]
category: "JavaScript"
draft: false
lang: ""
---

[Fiddler](https://en.wikipedia.org/wiki/Fiddler_\(software\)) is an useful HTTP proxy debugger on Windows. It would be nice if it can work with [Node.js](https://en.wikipedia.org/wiki/Node.js) applications. To do this, just need to proxy Node.js requests through Fiddler. The default proxy is 127.0.0.1:8888. This can be viewed in Fiddler Tools –> WInINET Options –> LAN settings –> Advanced:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Use-Fiddler-with-Nodejs_F458/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Use-Fiddler-with-Nodejs_F458/image_2.png)

## Request module

If the [request module](https://www.npmjs.com/package/request) is used to send requests, it is relatively easier. Environment variables can be used to turn on/off current node.js process’s fiddler proxy settings:

```bash
set https_proxy=http://127.0.0.1:8888
set http_proxy=http://127.0.0.1:8888
set NODE_TLS_REJECT_UNAUTHORIZED=0
node Dixin.Nodejs\main.js
```

It’s done. After setting the above 3 environment variables, when calling request module to send requests, they will be captured by Fiddler. If the proxy settings needs to be turned off, just set these environment variables to empty:

```bash
set https_proxy=
set http_proxy=
set NODE_TLS_REJECT_UNAUTHORIZED=
```

This can be done with JavaScript. Here is part of a simple fiddler.js module:

```js
"use strict";

var url = require("url"),
    http = require("http"),

    env = process.env,

    proxy = {
        protocol: "http:",
        hostname: "127.0.0.1",
        port: 8888,
    },

    proxyRequests = function () {
        var proxyUrl = url.format(proxy);
        env.http_proxy = proxyUrl;
        env.https_proxy = proxyUrl;
        env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
    },

    unproxyRequests = function () {
        env.http_proxy = "";
        env.https_proxy = "";
        env.NODE_TLS_REJECT_UNAUTHORIZED = "";
    },
```

The usage is straightforward:

```js
var fiddler = require("./fiddler");
fiddler.proxyRequests();
// requests.
fiddler.unproxyRequests();
```

## HTTP/HTTPS module

If requests are sent with [HTTP](https://nodejs.org/api/http.html)/[HTTPS](https://nodejs.org/api/https.html) modules of Node.js, there is no global switch to turn on/off proxy settings for all requests. Some helper methods can be created to proxy an individual HTTP request to Fiddler. Below is the rest of the fiddler.js module:

```js
setProxy = function (options) {
        if (typeof options === "string") { // options can be URL string.
            options = url.parse(options);
        }
        if (!options.host && !options.hostname) {
            throw new Error("host or hostname must have value.");
        }
        options.path = url.format(options);
        options.headers = options.headers || {};
        options.headers.Host = options.host || url.format({
            hostname: options.hostname,
            port: options.port
        });
        options.protocol = proxy.protocol;
        options.hostname = proxy.hostname;
        options.port = proxy.port;
        options.href = null;
        options.host = null;
        return options;
    },

    request = function (options, callback) {
        options = setProxy(options);
        return http.request(options, callback);
    },
    
    get = function(options, callback) {
        options = setProxy(options);
        return http.get(options, callback);
    };

module.exports = {
    proxy: proxy,
    proxyRequests: proxyRequests,
    unproxyRequests: unproxyRequests,
    setProxy: setProxy,
    request: request,
    get: get
};
```

When calling HTTP/HTTPS modules to send a request, call setProxy to proxy the request to Fiddler:

setProxy is used for the url/options, before passing it to call HTTP module methods, like request, get, etc. The following example proxies the request to URL string:

```js
var http = require("http"),
    https = require("https"),
    fiddler = require("./fiddler");

var photoUrl = "https://c1.staticflickr.com/3/2875/9215169916_f8fa57c3da_b.jpg";

https.request(photoUrl).end(); // Not through Fiddler.

http.request(fiddler.setProxy(photoUrl)).end(); // Through Fiddler.
```

The second request can be viewed in Fiddler:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Use-Fiddler-with-Nodejs_F458/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Use-Fiddler-with-Nodejs_F458/image_4.png)

Similarly, setProxy can be used for URI options:

```js
var blogUrl = {
    protocol: "https:",
    hostname: "weblogs.asp.net",
    pathname: "dixin"
};

https.get(blogUrl).end(); // Not through Fiddler.

http.get(fiddler.setProxy(blogUrl)); // Through Fiddler.
```

The second request is in Fiddler:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Use-Fiddler-with-Nodejs_F458/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Use-Fiddler-with-Nodejs_F458/image_6.png)

A get method and a request method are also provided. They are just shortcuts. The above calls are equivalent to:

```js
fiddler.request(photoUrl).end();
fiddler.get(blogUrl);
```

The complete fiddler.js module is available in GitHub: [https://github.com/Dixin/CodeSnippets/blob/master/Dixin.Nodejs/fiddler.js](https://github.com/Dixin/CodeSnippets/blob/master/Dixin.Nodejs/fiddler.js "https://github.com/Dixin/CodeSnippets/blob/master/Dixin.Nodejs/fiddler.js").