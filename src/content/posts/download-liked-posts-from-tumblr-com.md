---
title: "Download Liked Posts from Tumblr.com"
published: 2016-04-12
description: "After using tumblr.com for years, a lot of posts have been liked. It would be easier to look up if the contents of these posts are stored to local. Fortunately, tumblr has provided [a set of APIs](htt"
image: ""
tags: ["JavaScript", "Node.js", "Tumblr", "Visual Studio", "Web]
category: "JavaScript"
draft: false
lang: ""
---

After using tumblr.com for years, a lot of posts have been liked. It would be easier to look up if the contents of these posts are stored to local. Fortunately, tumblr has provided [a set of APIs](https://www.tumblr.com/docs/en/api/v2) to make this easy, and even an [API console](https://api.tumblr.com/console) to play with these APIs. The API client is also provided in:

-   [JavaScript](http://github.com/tumblr/tumblr.js)
-   [Ruby](http://github.com/tumblr/tumblr_client)
-   [PHP](http://github.com/tumblr/tumblr.php)
-   [Java](http://github.com/tumblr/jumblr)
-   [Python](http://github.com/tumblr/pytumblr)
-   [Objective-C](http://github.com/tumblr/TMTumblrSDK)

which are all open source.

## Create application and install dependent modules

Here JavaScript would a nice option, since Microsoft has released a [Node.js Tools](https://www.visualstudio.com/en-us/features/node-js-vs.aspx) for Visual Studio 2015. So, first, create a Node.js application:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Download_12B7F/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Download_12B7F/image_2.png)

Then, install npm modules. Instead of installing the tumblr module directly, here [tumblr-auto-auth](https://www.npmjs.com/package/tumblr-auto-auth) is installed. Because tumblr APIs uses OAuth 1.0a, and this tumblr-auto-auth module handles the authentication/authorization. It also installs the tumblr module as its dependency.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Download_12B7F/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Download_12B7F/image_4.png)

Also, [Q](https://github.com/kriskowal/q) can be installed for promise-based asynchronous programming.

## Create utility functions

The plan is to download the pictures/video in each post, so a download utility function is needed. Node.js does not have such a built-in API, but it is easy to create one in a common module (common.js):

```csharp
var http = require("http"),
    fs = require("fs"),
    Q = require("q"),

    download = function (url, path) {
        var deferred = Q.defer(),
            file = fs.createWriteStream(path);
        console.log("Downloading " + url + "to " + path);
        http.get(url, function (response) {
            response.pipe(file);
            file.on("finish", function () {
                file.close(deferred.resolve);
            });
        }).on("error", function (error) {
            fs.unlink(path);
            deferred.reject(error);
        });
        return deferred.promise;
    },
```

It simply downloads the specified URL to the specified file system path. And Q is used to convert the callback style asynchronous programming model into promise style. This is very useful to stay away from [callback hell](https://strongloop.com/strongblog/node-js-callback-hell-promises-generators/).

To save the downloaded file to local, a file name is needed. The easiest way is to directly use the file name from the URL. But it would be nice if the file name can have more semantics, which will be very helpful for search. So the post id and the post summary text can be used as the local file name. Notice not all the characters in the text can be used in file names. So another utility function is needed to remove those [reversed and disallowed characters](https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247.aspx#file_and_directory_names) from text:

```csharp
removeReservedCharactersFromFileName = function (fileName) {
        // https://en.wikipedia.org/wiki/Filename#Reserved_characters_and_words
        // https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247.aspx#file_and_directory_names
        return fileName.replace(/[<>:"/\\|?*\x00-\x1F\r\n\t]/g, "");
    },
```

Then export these 2 functions:

```csharp
module.exports = {
    download: download,
    removeReservedCharactersFromFileName: removeReservedCharactersFromFileName,
    exists: exists
};
```

## Download post’s pictures/video files then unlike post

Now a tumblr module (tumblr.js) can be created. The first step is to create a tumblr client, with tumblr-auto-auth, this is extremely simple:

```csharp
var path = require("path"),
    util = require("util"),
    Q = require("q"),
    tumblr = require("tumblr-auto-auth"),
    common = require("./common"),

    getClient = function (options) {
        var deferred = Q.defer();
        tumblr.getAuthorizedClient({
            userEmail: options.userEmail,
            userPassword: options.userPassword,
            appConsumerKey: options.appConsumerKey,
            appSecretKey: options.appSecretKey,
            debug: options.debug
        }, function (error, client) {
            if (error) {
                deferred.reject(error);
            } else {
                options.client = client;
                deferred.resolve(options);
            }
        });
        return deferred.promise;
    },
```

Q is consistently used for asynchrony.

Then the created client can be used to pull the liked posts of the specified user from tumblr. Just call client.likes:

```csharp
getLikes = function (options) {
        var deferred = Q.defer();
        options.client.likes(options, function (error, data) {
            if (error) {
                deferred.reject(error);
            } else {
                console.log("Likes: " + data.liked_count);
                options.posts = data.liked_posts;
                options.likesCount = data.liked_count;
                deferred.resolve(options);
            }
        });
        return deferred.promise;
    },
```

It will send a GET request to tumblr. The response will be a JSON data. data.liked\_posts is an array of post objects, and data.liked\_count is the total count of liked posts all time.

Now it is time to download the contents of each post. A post can have:

-   one or more pictures
-   one video file.

All files will be downloaded by calling common.download, which was defined a moment ago:

```csharp
downloadPost = function (post, directory, getFileName) {
        var downloads = [];
        console.log("Processing " + post.post_url);
        if (post.photos) { // Post has pictures.
            post.photos.forEach(function (photo, index) {
                var url = photo.original_size.url;
                var file = path.join(directory, getFileName(post, url, index));
                downloads.push(common.download(url, file).thenResolve({
                    post: post, 
                    url: url, 
                    file: file,
                    type: "photo"
                }));
            });
        }
        if (post.video_url) { // Post has videos.
            var url = post.video_url;
            var file = path.join(directory, getFileName(post, url));
            downloads.push(common.download(url, file).thenResolve({
                post: post, 
                url: url, 
                file: file,
                type: "video"
            }));
        }
        return Q.all(downloads);
    },
```

Since common.download returns a promise object, all these promise objects can be pushed to a promise array, then Q.all can be called to composite them to a single promise object. Q.all is similar to [Task.WaitAll](https://msdn.microsoft.com/en-us/library/dd270695.aspx) in .NET.

Also a getFileName function is used to generate file name with post id and file URL (either URL of a picture, or URL of a video):

```csharp
getFileName = function (post, url, index) {
        var summary = post.summary ? common.removeReservedCharactersFromFileName(post.summary).trim() : "",
            extension = url.split(".").pop();
        summary = summary ? " " + summary.substring(0, 30) : "";
        index = index ? index : 0;
        // return `${post.id} ${index}${summary}.${extension}`;
        return post.id + " " + index + summary + "." + extension;
    },
```

Unfortunately, Node.js Tools for Visual Studio does not support [ECMAScript 2015/ES 6](http://www.ecma-international.org/ecma-262/6.0/), even though [Node.js already support it](https://nodejs.org/en/docs/es6/). So here the old string concatenation syntax is applied instead of the new [template string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/template_strings) syntax.

After finishing downloading all files in a post, this post can be removed from liked posts list. Tumblr client has a unlike API for this:

```csharp
unlikePost = function (options) {
        var deferred = Q.defer();
        console.log("Unliking post " + options.post.post_url);
        options.client.unlike(options.post.id, options.post.reblog_key, function (error, data) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(options);
            }
        });
        return deferred.promise;
    },
```

Now it is time to composite these steps together. They all return a promise, so it is quite easy and straightforword:

```csharp
downloadAllAndUnlike = function (options) {
        getClient(options) // Get tumblr client.
            .then(getLikes) // Get tumblr liked post.
            .then(function (options) {
                if (options.likesCount > 0 && options.posts && options.posts.length > 0) {
                    // If there is any liked post.  
                    Q.all(options.posts.map(function (post) { // Download each liked post.
                        return downloadPost(post, options.directory, getFileName).then(function (download) {
                            return unlikePost({ // After downloading all files of the tumblr post, unlike it
                                client: options.client,
                                post: post
                            }).thenResolve(download);
                        });
                    })).then(function (posts) { // After downloading and unliking all tumblr post, log them.
                        if (util.isArray(posts)) {
                            posts.forEach(console.log);
                        } else {
                            console.log(posts);
                        }
                    }, function (errors) { // If there is error, log it.
                        if (util.isArray(errors)) {
                            errors.forEach(console.error);
                        } else {
                            console.error(errors);
                        }
                    }).then(function() {
                        downloadAllAndUnlike(options); // Download gain, recursively.
                    });
                }
                // If there is not any liked post, stop. Recursion terminates.
            });
    };
```

When calling tumblr API to get liked posts, the API returns 50 posts even when there is more. So, above downloadAllAndUnlike is a recursive function:

-   When there is any liked post to download, it calls itself recursively to try to download again.
-   When there is nothing to download, the recursion terminates.

And finally, export downloadAllAndUnlike function:

```csharp
module.exports = {
    downloadAllAndUnlike: downloadAllAndUnlike
};
```

## Start working

To start downloading, specify a startup file for this Node.js application:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Download_12B7F/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Download_12B7F/image_6.png)

In the startup file (main.js), just call downloadAllAndUnlike function of the tumblr module:

```csharp
var tumblr = require("./tumblr");

tumblr.downloadAllAndUnlike({
    userEmail: "dixinyan@live.com",
    userPassword: "...",
    appConsumerKey: "...",
    appSecretKey: "...",
    offset: 5,
    limit: 51,
    directory: "D:\\Downloads\\Tumblr",
    after: 1
});
```

The user email, user password, application consumer key, and application secrete key are required. To get the application consumer/secrete key, just [register an application in tumblr](https://www.tumblr.com/oauth/apps).