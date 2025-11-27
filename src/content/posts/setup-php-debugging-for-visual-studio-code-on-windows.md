---
title: "End-to-end: Setup PHP Debugging for Visual Studio Code on Windows"
published: 2018-04-07
description: "This is a quick tutorial of minimum installation and configurations of development environment for PHP programming, including Apache, PHP, and Visual Studio Code (VSCode) on 64 bit Windows."
image: ""
tags: ["Visual Studio Code", "PHP", "Apache", "XDebug"]
category: "Visual Studio Code"
draft: false
lang: ""
---

This is a quick tutorial of minimum installation and configurations of development environment for PHP programming, including Apache, PHP, and Visual Studio Code (VSCode) on 64 bit Windows.

## Prerequisite

Check if Visual C++ 2015 Redistributable (x64) or higher version is installed for Windows.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup-PHP-for-Visual-Studio-Code-on-Wind_12515/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup-PHP-for-Visual-Studio-Code-on-Wind_12515/image_7.png)

If not, install it from Microsoft [https://www.visualstudio.com/downloads/](https://www.visualstudio.com/downloads/ "https://www.visualstudio.com/downloads/"):

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup-PHP-for-Visual-Studio-Code-on-Wind_12515/image_thumb_3.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup-PHP-for-Visual-Studio-Code-on-Wind_12515/image_8.png)

## Setup Apache

Go to Apache website: [https://httpd.apache.org/docs/current/platform/windows.html#down](https://httpd.apache.org/docs/current/platform/windows.html#down "https://httpd.apache.org/docs/current/platform/windows.html#down"), and download the Windows version, for example, httpd-2.4.25-win64-VC14.zip.

Extract the files to a folder, for example, D:\\Software\\Apache.

Then go to the Apache installation directory, under conf directory, open httpd.conf file, replace all “**c:/Apache24**” strings with relative path “**..**”.

## Setup PHP

Go to PHP website: [http://windows.php.net/download](http://windows.php.net/download "http://windows.php.net/download"), download the Windows version, for example, VC14 x64 Thread Safe.

Extract the files to a folder, for example, D:\\Software\\Php.

Go to the PHP directory, copy the php.ini-development file, and paste as php.ini.

Open the file,

-   Uncomment **; extension\_dir = "ext"**, and replace with relative path **extension\_dir = "..\\..\\Php\\ext"**
-   Enable the extensions, like curl, gd2, mbstring, sockets, etc., by comment the configurations, like **extension=php\_curl.dll**, etc.
-   Replace the temporary directory “**..\\tmp**” with the correct path, for example “**..\\..\\Temp\\Php**”

Go back to Apache’s conf/httpd.conf file,

-   add **LoadModule php7\_module "../Php/php7apache2\_4.dll"**,
-   add **AddType application/x-httpd-php .php**,
-   add **PHPIniDir ../php**

### Setup XDebug

Go to XDebug website: [https://xdebug.org/download.php](https://xdebug.org/download.php "https://xdebug.org/download.php"), download the Windows version, for example, PHP 7.1 VC14 TS (64 bit) in this case.

Extract the single file to PHP extensions directory, for example, D:\\Software\\Php\\ext\\php\_xdebug-2.5.4-7.1-vc14-x86\_64.dll in this case.

Go to php.ini, add relative path of XDebug, for example, **zend\_extension = ..\\..\\Php\\ext\\php\_xdebug-2.5.4-7.1-vc14-x86\_64.dll**.

## Setup Visual Studio Code

Go to Visual Studio Code website: [https://code.visualstudio.com](https://code.visualstudio.com), install Visual Studio Code.

Launch Visual Studio Code, install the PHP Debug extension: [https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-debug](https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-debug "https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-debug").

Go to the settings, change the "**php.validate.executablePath**" item to PHP binary path, for example, "**D:\\\\Software\\\\Php\\\\php.exe**".

## Setup Website

Go to Apache’s conf/httpd.conf,

-   Set the port, for example, change **Listen 80** to **Listen 81**.
-   Uncomment server name, for example **ServerName localhost:81**
-   Set document root to website directory, for example, change **DocumentRoot "c:/Apache24/htdocs"** to **DocumentRoot "../../../Code/Website"**
-   Change **<Directory "c:/Apache24/htdocs">** to the website directory too **<Directory "../../../Code/Website">**
-   Inside **<Directory />**, change **Require all denied** to **Require all granted**
-   Add index.php as directory index, by changing **DirectoryIndex index.html** to **DirectoryIndex index.php index.html**

In command line, run D:\\Software\\Apache\\bin\\httpd.exe.

Open the website directory with Visual Studio Code, create a file index.php with one line of code: **<?php phpinfo(); ?>**, add a break point. Press F5 to start debugging.

Open the website in browser: [http://localhost:81](http://localhost:81), the index.php is executed, and the break point is triggered in Visual Studio Code.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup-PHP-for-Visual-Studio-Code-on-Wind_12515/image_thumb_4.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Setup-PHP-for-Visual-Studio-Code-on-Wind_12515/image_10.png)