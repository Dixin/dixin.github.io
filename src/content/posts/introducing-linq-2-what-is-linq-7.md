---
title: "Functional Programming and LINQ Paradigm (2) LINQ Overview"
published: 2018-05-29
description: "As fore mentioned, LINQ consists of syntax in languages and APIs in libraries:"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## **Latest version:** https://weblogs.asp.net/dixin/introducing-linq-2-what-is-linq

As fore mentioned, LINQ consists of syntax in languages and APIs in libraries:

[![image_thumb1](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Functional-Programming-and-LINQ-Paradigm_150FF/image_thumb1_thumb.png "image_thumb1")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Functional-Programming-and-LINQ-Paradigm_150FF/image_thumb1_2.png)

For a certain language, like C#, there is only 1 set of LINQ query syntax, which works with many LINQ API sets, and each API set works with a specific data domain. Here are examples of these API sets:

-   In .NET Standard, Microsoft provides:

-   LINQ to Objects: a set of LINQ APIs for .NET objects in memory
-   Parallel LINQ: another set of LINQ APIs also for .NET objects in memory, but in parallel
-   LINQ to XML: a set of LINQ APIs for XML data objects in memory

-   Microsoft also provides other libraries based on .NET Standard:

-   LINQ to Entities: a set of LINQ APIs in Entity Framework (EF) and Entity Framework Core (EF Core) NuGet packages for relational databases, including Microsoft SQL Server, Microsoft Azure SQL Database (aka SQL Azure), as well as SQLite, Oracle, MySQL, PostgreSQL, etc.
-   LINQ to NoSQL: a set of LINQ APIs for Azure CosmosDB, the Microsoft NoSQL database service

-   In .NET Framework for Windows, Microsoft provides:

-   LINQ to DataSets: a set of LINQ APIs for data cached in data sets
-   LINQ to SQL: a set of LINQ APIs for relational data in Microsoft SQL Server

-   There are also also third party LINQ libraries/APIs:

-   LINQ to JSON, s set of LINQ APIs for JSON data in memory
-   LINQ to Twitter, a set of LINQ APIs for Twitter data in Twitter’s services
-   etc.

<table border="0" cellpadding="2" cellspacing="0" width="849"><tbody><tr><td valign="top" width="131">LINQ APIs</td><td valign="top" width="222">.NET Framework: Nuget package or .dll assembly</td><td valign="top" width="223">.NET Standard: Nuget package</td><td valign="top" width="271">Namespace</td></tr><tr><td valign="top" width="131">LINQ to Objects</td><td valign="top" width="222">System.Core.dll</td><td valign="top" width="223">NETStandard.Library</td><td valign="top" width="271">System.Linq</td></tr><tr><td valign="top" width="131">LINQ to Objects Interactive Extension (Ix)</td><td valign="top" width="222">System.Interactive</td><td valign="top" width="223">System.Interactive</td><td valign="top" width="271">System.Linq</td></tr><tr><td valign="top" width="131">Parallel LINQ</td><td valign="top" width="222">System.Core.dll</td><td valign="top" width="223">NETStandard.Library</td><td valign="top" width="271">System.Linq</td></tr><tr><td valign="top" width="131">LINQ to XML</td><td valign="top" width="222">System.Xml.Linq.dll</td><td valign="top" width="223">NETStandard.Library</td><td valign="top" width="271">System.Xml.Linq</td></tr><tr><td valign="top" width="131">LINQ to Entities</td><td valign="top" width="222">EntityFramework, Microsoft.EntityFrameworkCore</td><td valign="top" width="223">Microsoft.EntityFrameworkCore</td><td valign="top" width="271">System.Data.Entity (EF), Microsoft.EntityFrameworkCore (EF Core)</td></tr><tr><td valign="top" width="131">LINQ to NoSQL</td><td valign="top" width="222">Microsoft.Azure.DocumentDB</td><td valign="top" width="223">Microsoft.Azure.DocumentDB.Core</td><td valign="top" width="271">Microsoft.Azure.Documents.Client</td></tr><tr><td valign="top" width="131">LINQ to SQL</td><td valign="top" width="222">System.Data.Linq.dll</td><td valign="top" width="223">Not available</td><td valign="top" width="271">System.Data.Linq</td></tr><tr><td valign="top" width="131">LINQ to DataSets</td><td valign="top" width="222">System.Data.DataSetExtensions.dll</td><td valign="top" width="223">Not available</td><td valign="top" width="271">System.Data</td></tr><tr><td valign="top" width="131">LINQ to JSON</td><td valign="top" width="222">Newtonsoft.Json</td><td valign="top" width="223">Newtonsoft.Json</td><td valign="top" width="271">Newtonsoft.Json.Linq</td></tr><tr><td valign="top" width="131">LINQ to Twitter</td><td valign="top" width="222">linqtotwitter</td><td valign="top" width="223">linqtotwitter</td><td valign="top" width="271">LinqToTwitter</td></tr></tbody></table>

## One language for different data domains

C# developer can use a single LINQ language syntax to work with different data. At compile time, the LINQ syntax can be compiled to different API calls according to different contexts. At runtime, these specific API calls work with specific data domains.

### LINQ to Objects

When using any LINQ technology to work with data, there are usually 3 steps:

1.  Get the data source for LINQ query
2.  Define the LINQ query
3.  Execute the LINQ query

LINQ to Objects queries .NET objects in memory. The following example queries positive integers from the integer array in memory, and get the integers’ square roots in ascending order:

```csharp
internal static partial class Linq
{
    internal static void LinqToObjectsQueryExpression()
    {
        IEnumerable<int> source = new int[] { 4, 3, 2, 1, 0, -1 }; // Get source.
        IEnumerable<double> query =
            from int32 in source
            where int32 > 0
            orderby int32
            select Math.Sqrt(int32); // Define query.
        foreach (double result in query) // Execute query.
        {
            Trace.WriteLine(result);
        }
    }
}
```

Here the data source is a sequence of integers in memory. The query is created declaratively in native C# language keywords (where, orderby, select, etc.), which is called query expression:

-   The from clause specifies data source
-   The where clause filters the data source and keeps the integers greater than 0,
-   The orderby clause sort the filtered integers in ascending order
-   The select clause maps the sorted integers to their square roots.

Creating the query is only building the filter-sort-map query flow without executing it. Later, when pulling the results from the query with a foreach loop, the query is executed.

Besides above query expression syntax. There is another query method call syntax to create LINQ query:

```csharp
internal static void LinqToObjectsQueryMethods()
{
    IEnumerable<int> source = new int[] { 4, 3, 2, 1, 0, -1 }; // Get source.
    IEnumerable<double> query = source
        .Where(int32 => int32 > 0)
        .OrderBy(int32 => int32)
        .Select(int32 => Math.Sqrt(int32)); // Define query.
    foreach (double result in query) // Execute query.
    {
        Trace.WriteLine(result);
    }
}
```

This time, the query is built by calling **Where**, **OrderBy**, **Select** methods. These 2 versions of query are identical. The query expression is compiled to query method calls, which will be discussed in detail in the Functional Programming and LINQ to Objects chapters.

### Parallel LINQ

The above LINQ to Object queries execute sequentially. The filter-sort-map computation are executed for all integers with a single thread, and the query results are produced one by one in a deterministic order. Parallel LINQ (to Objects) is the parallel version of the LINQ to Objects APIs. It also work with objects in memory, but can execute the query in parallel with multiple threads, in order to utilize all processor cores and improve the LINQ query performance. The following are the parallel version of the above queries:

```csharp
internal static void ParallelLinq()
{
    int[] values = { 4, 3, 2, 1, 0, -1 };
    ParallelQuery<int> source = values.AsParallel(); // Get source.
    ParallelQuery<double> query =
        from int32 in source
        where int32 > 0
        orderby int32
        select Math.Sqrt(int32); // Define query.
    // Equivalent to:
    // ParallelQuery<double> query = source
    //    .Where(int32 => int32 > 0)
    //    .OrderBy(int32 => int32)
    //    .Select(int32 => Math.Sqrt(int32));
    query.ForAll(result => Trace.WriteLine(result)); // Execute query.
}
```

The query creation syntax is exactly the same as sequential LINQ to Objects. The query execution syntax is different. In the previous LINQ to Objects query execution, a foreach loop is used to pull the results one by one sequentially. Here Parallel LINQ provides a special ForAll method to execute the pulling in parallel. Since the results are computed in parallel, the query results can be produced in nondeterministic order.

### LINQ to XML

LINQ to XML queries XML data. Take an ASP.NET blog RSS feed [https://weblogs.asp.net/dixin/rss](/posts/rss "https://weblogs.asp.net/dixin/rss") as example:

```xml
<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>Dixin's Blog</title>
    <link>https://weblogs.asp.net:443/dixin/</link>
    <description>https://weblogs.asp.net:443/dixin/</description>
    <item>
      <title>EntityFramework.Functions: Code First Functions for Entity Framework</title>
      <link>https://weblogs.asp.net/dixin/entityframework.functions</link>
      <description><!-- Description. --></description>
      <pubDate>Mon Dec 17, 2015 06:27:56 GMT</pubDate>
      <guid isPermaLink="true">https://weblogs.asp.net/dixin/entityframework.functions</guid>
      <category>.NET</category>
      <category>LINQ</category>
      <category>Entity Framework</category>
      <category>LINQ to Entities</category>
      <category>Code First</category>
    </item>
    <!-- More items. -->
  </channel>
</rss>
```

It is a XML document, and can be the source of LINQ to XML. This following example queries the items with permalink from the feed, and get the items’ titles. in ascending order of the items’ publish dates:

```csharp
internal static void LinqToXml()
{
    XDocument feed = XDocument.Load("https://weblogs.asp.net/dixin/rss");
    IEnumerable<XElement> source = feed.Descendants("item"); // Get source.
    IEnumerable<string> query =
        from item in source
        where (bool)item.Element("guid").Attribute("isPermaLink")
        orderby (DateTime)item.Element("pubDate")
        select (string)item.Element("title"); // Define query.
    // Equivalent to:
    // IEnumerable<string> query = source
    //    .Where(item => (bool)item.Element("guid").Attribute("isPermaLink"))
    //    .OrderBy(item => (DateTime)item.Element("pubDate"))
    //    .Select(item => (string)item.Element("title"));
    foreach (string result in query) // Execute query.
    {
        Trace.WriteLine(result);
    }
}
```

In this example, the data source is XML data loaded in memory. It queries all <item> elements in the XML document, filter them and only keep the <item> elements with child <guid> elements, whose isPermaLink attributes have the value true, then sort the <item> element by the time represented by the child <pubDate> elements in descending order; then get <item> elements’ child <title> elements’ values. Again, later when pulling the results from the query with a foreach loop, the query is executed.

### LINQ to DataSets

.NET Framework provides **System.Data.DataSet** type to cache data in memory. Each **DataSet** instance contains **System.Data.DataTable** instances, and each **DataTable** instance contains **System.Data.DataRow** instances. **DataSet**s are frequently used to cache tabular data from relational database. When working with relational database, this tutorial uses Microsoft SQL database and Microsoft AdventureWorks sample database for demonstration. In the following example, data is read from the **AdventureWorks** database’s **Production.Product** table, and cached in a **DataSet** instance. This LINQ query use this cached data in memory (not the data stored in database) as data source, and queries the products in the specified subcategory, and get the products’ names, in ascending order of products’ list prices.

```sql
internal static void LinqToDataSets(string connectionString)
{
    using (DataSet dataSet = new DataSet())
    using (DataAdapter dataAdapter = new SqlDataAdapter(
        @"SELECT [Name], [ListPrice], [ProductSubcategoryID] FROM [Production].[Product]", connectionString))
    {
        dataAdapter.Fill(dataSet);
        EnumerableRowCollection<DataRow> source = dataSet.Tables[0].AsEnumerable(); // Get source.
        EnumerableRowCollection<string> query =
            from product in source
            where product.Field<int>("ProductSubcategoryID") == 1
            orderby product.Field<decimal>("ListPrice")
            select product.Field<string>("Name"); // Define query.
        // Equivalent to:
        // EnumerableRowCollection<string> query = source
        //    .Where(product => product.Field<int>("ProductSubcategoryID") == 1)
        //    .OrderBy(product => product.Field<decimal>("ListPrice"))
        //    .Select(product => product.Field<string>("Name"));
        foreach (string result in query) // Execute query.
        {
            Trace.WriteLine(result);
        }
    }
}
```

Here the query is created to filter the products in the **DataSet** object, and only keeps the products under the specified subcategory, then sort the products by their list price fields, then get the products’ name fields. Later, when pulling the results from the query with a foreach loop, the query is executed.

### LINQ to Entities

Microsoft EF/Core providesLINQ to Entities enables LINQ queries directly working with data in relational databases. The AdventureWorks sample database includes the following 3 related tables:

[![image_thumb31_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Functional-Programming-and-LINQ-Paradigm_150FF/image_thumb31_thumb_thumb.png "image_thumb31_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Functional-Programming-and-LINQ-Paradigm_150FF/image_thumb31_thumb_2.png)

The following example queries **Production.Product** table for the products under the specified category, and get the products’ names in the order of their list prices:

```csharp
internal static void LinqToEntities()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        IQueryable<Product> source = adventureWorks.Products; // Get source.
        IQueryable<string> query =
            from product in source
            where product.ProductSubcategory.ProductCategory.Name == "Bikes"
            orderby product.ListPrice
            select product.Name; // Define query.
        // Equivalent to:
        // IQueryable<string> query = source
        //    .Where(product => product.ProductSubcategory.ProductCategory.Name == "Bikes")
        //    .OrderBy(product => product.ListPrice)
        //    .Select(product => product.Name);
        foreach (string result in query) // Execute query.
        {
            Trace.WriteLine(result);
        }
    }
}
```

Here the data source is the relational data stored in the remote database table, not local .NET objects in memory. The above **AdventureWorks** type is the LINQ to Entities data context and represents the database, and its **Products** property represents the table. The query is created to filter the products in the table, and only keeps the products under the specified category, then sort the products by their list prices, and get the products’ names. Later, when pulling the results from the query with a foreach loop, the query is executed to read from the database.

### LINQ to SQL

LINQ to SQL is a lightweight database access technology provided by .NET Framework. As the name suggests, LINQ to SQL only works with Microsoft SQL Server. Its APIs are similar to LINQ to Entities APIs. So if the above queries are implemented by LINQ to SQL, the code can have the same looking:

```csharp
#if NETFX
internal static void LinqToSql()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        IQueryable<Product> source = adventureWorks.Products; // Get source.
        IQueryable<string> query =
            from product in source
            where product.ProductSubcategory.ProductCategory.Name == "Bikes"
            orderby product.ListPrice
            select product.Name; // Define query.
        // Equivalent to:
        // IQueryable<string> query = source
        //    .Where(product => product.ProductSubcategory.ProductCategory.Name == "Bikes")
        //    .OrderBy(product => product.ListPrice)
        //    .Select(product => product.Name);
        foreach (string result in query) // Execute query.
        {
            Trace.WriteLine(result);
        }
    }
}
#endif
```

Here the **AdventureWorks** type is a LINQ to SQL data context, which is different from the LINQ to Entities data context. So the pulling execution on the query triggers LINQ to SQL API calls, which read data from the database.

### LINQ to NoSQL (LINQ to CosmosDB)

LINQ can also work with non relational database (aka NoSQL database). Microsoft Azure CosmosDB is such a NoSQL database service, and it provides client library to enable LINQ queries. To setup a data source for LINQ, [create a free account](https://azure.microsoft.com/en-us/free/), then follow the Microsoft documents to import some JSON documents representing some stores with addresses:

```csharp
[
    {
        "id": "1424",
        "Name": "Closeout Boutique",
        "Address": {
            "AddressType": "Main Office",
            "AddressLine1": "1050 Oak Street",
            "Location": {
                "City": "Seattle",
                "StateProvinceName": "Washington"
            },
            "PostalCode": "98104",
            "CountryRegionName": "United States"
        }
    },
    // More documents.
]
```

Here the source is the database’s Store collection. The following example queries the stores in the specified city, and get their names in the alphabetic order:

```csharp
internal static void LinqToNoSql(string key)
{
    using (DocumentClient client = new DocumentClient(
        new Uri("https://dixin.documents.azure.com:443/"), key))
    {
        IOrderedQueryable<Store> source = client.CreateDocumentQuery<Store>(
            UriFactory.CreateDocumentCollectionUri("dixin", "Store")); // Get source.
        IQueryable<string> query = from store in source
                                    where store.Address.Location.City == "Seattle"
                                    orderby store.Name
                                    select store.Name; // Define query.
        // Equivalent to:
        // IQueryable<string> query = source
        //    .Where(store => store.Address.CountryRegionName == "United States")
        //    .OrderBy(store => store.Address.PostalCode)
        //    .Select(store => store.Name);
        foreach (string result in query) // Execute query.
        {
            Trace.WriteLine(result);
        }
    }
}
```

The query is created to filter the products in the collection, and only keeps the stores in the specified city, then sort the stores by their names, then get the the stores’ names.

### LINQ to JSON

LINQ to JSON is a third party set of APIs enabling LINQ for JSON data. Tumblr provides APIs returning JSON data, which can be a data source:

```csharp
{
  "meta": {
    "status": 200,
    "msg": "OK"
  },
  "response": {
    "blog": {
      "title": "Dixin Yan",
      "name": "dixinyan",
      "total_posts": 20,
      "posts": 20,
      "url": "http://dixinyan.tumblr.com/",
      "updated": 1487649099,
      "description": "Blog - https://weblog.asp.net/dixin",
      "is_nsfw": false,
      "ask": true,
      "ask_page_title": "Ask me anything",
      "ask_anon": true,
      "share_likes": false
    },
    "posts": [
      {
        "type": "photo",
        "blog_name": "dixinyan",
        "id": 94086491678,
        "post_url": "http://dixinyan.tumblr.com/post/94086491678/microsoft-way-microsoft-campus-microsoft-campus",
        "slug": "microsoft-way-microsoft-campus-microsoft-campus",
        "date": "2014-08-07 19:11:43 GMT",
        "timestamp": 1407438703,
        "state": "published",
        "format": "html",
        "reblog_key": "FZQVzcFD",
        "tags": [ "Microsoft" ],
        "short_url": "https://tmblr.co/Z_W6Et1Nd-UuU",
        "summary": "Microsoft Way, Microsoft Campus  Microsoft Campus is the informal name of Microsoft's corporate headquarters, located at One...",
        "recommended_source": null,
        "recommended_color": null,
        "note_count": 4,
        "caption": "<h2>Microsoft Way, Microsoft Campus </h2><p>Microsoft Campus is the informal name of Microsoft&rsquo;s corporate headquarters, located at One Microsoft Way in Redmond, Washington. Microsoft initially moved onto the grounds of the campus on February 26, 1986. <a href=\"http://en.wikipedia.org/wiki/Microsoft_Redmond_Campus\" target=\"_blank\">en.wikipedia.org/wiki/Microsoft_Redmond_Campus</a>\n\n<a href=\"https://www.flickr.com/dixin\" target=\"_blank\"></a></p>",
        "image_permalink": "http://dixinyan.tumblr.com/image/94086491678",
        "can_like": true,
        "can_reblog": true,
        "can_send_in_message": true,
        "can_reply": false,
        "display_avatar": true
        // More post info.
      },
      // More posts.
    ],
    "total_posts": 20
  }
}
```

The following example queries the posts with specified tag, and get their summary in the order of items’ publish date:

```csharp
internal static async Task LinqToJson(string apiKey)
{
    using (HttpClient httpClient = new HttpClient())
    {
        string feedUri = $"https://api.tumblr.com/v2/blog/dixinyan.tumblr.com/posts/photo?api_key={apiKey}";
        JObject feed = JObject.Parse((await httpClient.GetStringAsync(feedUri)));
        IEnumerable<JToken> source = feed["response"]["posts"]; // Get source.
        IEnumerable<string> query =
            from post in source
            where post["tags"].Any(tag => "Microsoft".Equals((string)tag, StringComparison.OrdinalIgnoreCase))
            orderby (DateTime)post["date"]
            select (string)post["summary"]; // Define query.
        // Equivalent to:
        // IEnumerable<string> query = source
        //    .Where(post => post["tags"].Any(tag =>
        //        "Microsoft".Equals((string)tag, StringComparison.OrdinalIgnoreCase)))
        //    .OrderBy(post => (DateTime)post["date"])
        //    .Select(post => (string)post["summary"]);
        foreach (string result in query) // Execute query.
        {
            Trace.WriteLine(result);
        }
    }
}
```

It queries all posts in the JSON document, filter them and only keep the items with the specified tag, then sort the posts by their publish dates, then get the items’ titles.

### LINQ to Twitter

LINQ to Twitter is another third party library enabling LINQ queries for Twitter data. To access Twitter as a data source, [registering an app with Twitter](https://apps.twitter.com/) to get the consumer key, consumer secrete, OAuth token, and OAuth token secrete. The following example queries the tweets with specified search keyword:

```csharp
internal static void LinqToTwitter(
    string consumerKey, string consumerSecret, string oAuthToken, string oAuthTokenSecret)
{
    SingleUserAuthorizer credentials = new SingleUserAuthorizer()
    {
        CredentialStore = new InMemoryCredentialStore()
        {
            ConsumerKey = consumerKey,
            ConsumerSecret = consumerSecret,
            OAuthToken = oAuthToken,
            OAuthTokenSecret = oAuthTokenSecret
        }
    };
    using (TwitterContext twitter = new TwitterContext(credentials))
    {
        IQueryable<Search> source = twitter.Search; // Get source.
        IQueryable<List<Status>> query =
            from search in source
            where search.Type == SearchType.Search && search.Query == "LINQ"
            orderby search.SearchMetaData.Count
            select search.Statuses; // Define query.
        // Equivalent to:
        // IQueryable<List<Status>> query = source
        //    .Where(search => search.Type == SearchType.Search && search.Query == "LINQ")
        //    .OrderBy(search => search.SearchMetaData.Count)
        //    .Select(search => search.Statuses);
        foreach (List<Status> search in query) // Execute query.
        {
            foreach (Status status in search)
            {
                Trace.WriteLine(status.Text);
            }
        }
    }
}
```

Sometimes the query result could be [funny](https://twitter.com/LinQ_official), because a Japanese idol girl music group is also named LinQ (Love in Qshu):

[![71aaD4GcBeL._SL1416_](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Introducing-LINQ-1-What-Is-LINQ_10D64/71aaD4GcBeL._SL1416__3.jpg "71aaD4GcBeL._SL1416_")](https://www.facebook.com/loveinq)

## Productivity

When LINQ was first released with .NET Framework 3.5, [MSDN](http://msdn.microsoft.com/en-us/netframework/aa904594.aspx) describes it as:

> LINQ is one of Microsoft’s most exciting, powerful new development technologies.

Traditionally, to work with a specific data domain, a domain specific language and a set of domain specific APIs are used. For example, the following example is equivalent to above LINQ to XML query logic, implemented in traditional programming model, which calls XML APIs to execute query expression in XPath language:

```csharp
internal static partial class Imperative
{
    internal static void Xml()
    {
        XPathDocument feed = new XPathDocument("https://weblogs.asp.net/dixin/rss");
        XPathNavigator navigator = feed.CreateNavigator();
        XPathExpression selectExpression = navigator.Compile("//item[guid/@isPermaLink='true']/title/text()");
        XPathExpression sortExpression = navigator.Compile("../../pubDate/text()");
        selectExpression.AddSort(sortExpression, Comparer<DateTime>.Default);
        XPathNodeIterator nodes = navigator.Select(selectExpression);
        foreach (object node in nodes)
        {
            Trace.WriteLine(node);
        }
    }
}
```

For SQL database, the traditional programming model implements the above LINQ to Entities query logic by calling ADO.NET data access APIs to execute query statement in SQL language:

```sql
internal static void Sql(string connectionString)
{
    using (DbConnection connection = new SqlConnection(connectionString))
    using (DbCommand command = connection.CreateCommand())
    {
        command.CommandText =
            @"SELECT [Product].[Name]
            FROM [Production].[Product] AS [Product]
            LEFT OUTER JOIN [Production].[ProductSubcategory] AS [Subcategory] 
                ON [Subcategory].[ProductSubcategoryID] = [Product].[ProductSubcategoryID]
            LEFT OUTER JOIN [Production].[ProductCategory] AS [Category] 
                ON [Category].[ProductCategoryID] = [Subcategory].[ProductCategoryID]
            WHERE [Category].[Name] = @categoryName
            ORDER BY [Product].[ListPrice] DESC";
        DbParameter parameter = command.CreateParameter();
        parameter.ParameterName = "@categoryName";
        parameter.Value = "Bikes";
        command.Parameters.Add(parameter);
        connection.Open();
        using (DbDataReader reader = command.ExecuteReader())
        {
            while (reader.Read())
            {
                string productName = (string)reader["Name"];
                Trace.WriteLine(productName);
            }
        }
    }
}
```

Similarly, for Twitter data, there are network APIs to query Twitter’s REST endpoints, etc. LINQ implements an unified and consistent language syntax and programming model for many different data domains. Above examples demonstrated the same C# syntax builds filter-sort-map query flows for CLR objects, XML data, cached tabular data, SQL database, NoSQL database, JSON, Twitter data. This capability makes LINQ a powerful and productive solution for working with data.

C# is a strongly typed language. In C#, any value has a type, including any value in LINQ query. And any expression is evaluated to a type, including LINQ query expressions. Any method has a type for each parameter and a type for return value, including LINQ query methods. So LINQ queries are checked by compiler and CLR for type safety, which is great help for productivity, unless **dynamic** typing is used to bypass the compiler check:

```csharp
internal static partial class Linq
{
    internal static void Dynamic()
    {
        IEnumerable<int> source = new int[] { 4, 3, 2, 1, 0, -1 }; // Get source.
        IEnumerable<dynamic> query =
            from dynamic value in source
            where value.ByPass.Compiler.Check > 0
            orderby value.ByPass().Compiler().Check()
            select value & new object(); // Define query.
        foreach (dynamic result in query) // Execute query.
        {
            Trace.WriteLine(result);
        }
    }
}
```

Strong typing also enables IntelliSense for IDE, which also improves the productivity:

[![image_thumb3](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Functional-Programming-and-LINQ-Paradigm_150FF/image_thumb3_thumb.png "image_thumb3")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Functional-Programming-and-LINQ-Paradigm_150FF/image_thumb3_2.png)

LINQ also supports deferred execution. Usually, LINQ query is executed only when the results are pulled from the query. This enables creating query with arbitrary complexity. In above examples, during the composition of filter-sort-map, no execution is triggered. Later, when the results are pulled, the entire filter-sort-map query executes is triggered. This is also important for productivity. Take above LINQ to Entities query as example, when the query is executed against the SQL database, the entire filter-sort-map query logic is submitted to database as a single database query. Without deferred execution, this cannot be done.

LINQ is not only about data query. Many LINQ libraries provide rich APIs to manipulate and change the data too, like LINQ to XML, LINQ to SQL, and EF/Core, and DocumentDB client, etc. Parallel LINQ is a special set of LINQ APIs, it can significantly improve the query performance for CLR objects, it also provides an simple programming model for general parallel computing.

## Local query vs. remote query

Generally, there are 2 kinds of LINQ technologies:

-   Local query: The data source for local query is .NET objects in local memory of current .NET application or service. Apparently, (sequential) LINQ to Objects queries, and Parallel LINQ (to Objects) queries are local queries. LINQ to XML have XML data loaded to memory as specialized .NET objects representing the XML data structure, then query these objects, so LINQ to XML queries are also local queries too. Similarly, LINQ to DataSets and LINQ to JSON queries are local queries too. As demonstrated above, the local sequential LINQ data source and query is represented by **System.Collections.Generics.IEnumerable<T>** interface, and the local parallel LINQ data source and query is represented by **System.Linq.ParallelQuery<T>** type.
-   Remote query: The data source for remote query is not in the local memory. For example, LINQ to Entities queries the data stored in a relational database, apparently the data source is not available as .NET objects in the memory of current .NET application or service. So LINQ to Entities queries are remote queries. So are LINQ to SQL, LINQ to DocumentDB and LINQ to Twitter. As demonstrated above, the remote LINQ data source and query is represented by **System.Linq.IQueryable<T>** interface.

There are so many LINQ technologies, it is infeasible and also unnecessary to have one tutorial for all of them. This tutorial covers C# language's LINQ features, and the most used LINQ APIs: LINQ to Object (sequential local queries), LINQ to XML (specialized local queries), Parallel LINQ (parallel local queries), as well as EF/Core (remote queries). With the unified and consistent LINQ programming model, mastering these LINQ knowledge enables developers working any other local or remote LINQ technologies, understanding the internal implementation of these LINQ technologies also enables developer to build custom LINQ APIs to for other local or remote data scenarios.