var selectedDataSourceId = null;
var selectedDataSourceName = null;
var widgetId = Fliplet.Widget.getDefaultId();
var dataSourceColumns = [];

Fliplet.Widget.setSaveButtonLabel("Close");
Fliplet.Widget.toggleCancelButton(false);

Fliplet.Widget.generateInterface({
  fields: [
    {
      type: "html",
      html: `Use this component to generate features within a screen using AI. The code created will be available in the developer tools.
            <br>
            <br>
            Select a data source if you want your feature to use a data source.
            <br><br>`,
    },
    {
      type: "provider",
      name: "dataSourceId",
      package: "com.fliplet.data-source-provider",
      data: function (value) {
        return {
          dataSourceTitle: "Data source",
          dataSourceId: value,
          appId: Fliplet.Env.get("appId"),
          default: {
            name: "Data source",
            entries: [],
            columns: [],
          },
          accessRules: [
            {
              allow: "all",
              type: ["select"],
            },
          ],
        };
      },
      onEvent: function (eventName, data) {
        // Listen for events fired from the provider
        if (eventName === "dataSourceSelect") {
          selectedDataSourceId = data.id;
          selectedDataSourceName = data.name;

          if (selectedDataSourceId) {
            Fliplet.DataSources.getById(selectedDataSourceId, {
              attributes: ["columns"],
            }).then(function (response) {
              dataSourceColumns = response.columns;
            });
          } else {
            dataSourceColumns = [];
          }
        }
      },
      beforeSave: function (value) {
        return value && value.id;
      },
    },
    {
      name: "prompt",
      type: "textarea",
      label: "Prompt",
      default: "",
      rows: 12,
      description:
        "You can ask AI to reference your data sources names, screens names and column names belonging to the logged in user's data.",
    },
    {
      type: "html",
      html: `<br>
            Clicking generate will ask AI to create the feature based on your prompt.
            <br><br>`,
    },
    {
      type: "html",
      html: '<input type="button" class="btn btn-primary generate-code" value="Generate code" />',
      ready: function () {
        $(this.$el).find(".generate-code").on("click", generateCode);
        toggleLoader(false);
      },
    },
    {
      type: "html",
      html: `<button disabled class="btn btn-primary generate-code-disabled">
                <div class="spinner-holder">
                  <div class="spinner-overlay"></div>
                </div>
                <div>Generating...</div>
            </button>`,
      ready: function () {
        toggleLoader(false);
      },
    },
    {
      type: "hidden",
      name: "css",
      label: "CSS",
      default: "",
      rows: 12,
    },
    {
      type: "hidden",
      name: "javascript",
      label: "JavaScript",
      default: "",
    },
    {
      type: "hidden",
      name: "layoutHTML",
      label: "Layout",
      default: "",
    },
    {
      type: "hidden",
      name: "regenerateCode",
      label: "Regenerate code",
      description: "Regenerate code",
      toggleLabel: "Regenerate",
      default: false,
    },
  ],
});

function toggleLoader(isDisabled) {
  if (isDisabled) {
    $(".interface").find(".generate-code-disabled").show();
    $(".interface").find(".generate-code").hide();
  } else {
    $(".interface").find(".generate-code-disabled").hide();
    $(".interface").find(".generate-code").show();
  }
}

function generateCode() {
  toggleLoader(true);
  var prompt = Fliplet.Helper.field("prompt").get();
  if (prompt) {
    return queryAI(prompt)
      .then(function (parsedContent) {
        // Save the generated code
        return saveGeneratedCode(parsedContent);
      })
      .catch(function (error) {
        toggleLoader(false);
        return Promise.reject(error);
      });
  } else {
    Fliplet.Studio.emit("reload-widget-instance", widgetId);
  }
}

function queryAI(prompt) {
  let systemPrompt = `
You are to only return the HTML, CSS, JS for the following user request. In the JS make sure that any selectors are using .ai-feature-${widgetId}

The format of the response should be as follows: 

### HTML
<div>
  <h1>Hello World</h1>
</div>
### CSS
div {
  color: red;
}
### JavaScript
document.addEventListener('DOMContentLoaded', function() {
  const div = document.querySelector('.ai-feature-${widgetId} div');
  div.style.color = 'blue';
});

For the HTML do not include any head tags, just return the html for the body. 
Use bootstrap v3.4.1 for css and styling.
Do not include any backticks in the response.
Ensure there are no syntax errors in the code and that column names with spaced in them are wrapped with square brackets.
Add inline comments for the code so technical users can make edits to the code. 
Add try catch blocks in the code to catch any errors and log the errors to the console. 
Ensure you chain all the promises correctly with return statements.
You must only return code in the format specified. Do not return any text.

If you get asked to use datasource js api for e.g. if you need to save data from a form to a datasource or need to read data dynamic data to show it on the screen you need to use the following API: 

### Connect to a data source by Name

You can also connect to a data source by its name (case-sensitive) using the 'connectByName' method.

Fliplet.DataSources.connectByName(${
    selectedDataSourceName || "Attendees"
  }).then(function (connection) {
  // check below for the list of instance methods for the connection object
});

---
#### Fetch all records

// use "find" with no options to get all entries
connection.find().then(function (records) {
  // records is an array
});


#### Fetch records with a query

Querying options are based on the [Sift.js](https://github.com/Fliplet/sift.js) operators, which mimic MongoDB querying operators. Here are the supported operators from Sift.js:

  - '$in', '$nin', '$exists', '$gte', '$gt', '$lte', '$lt', '$eq', '$ne', '$iLike', '$mod', '$all', '$and', '$or', '$nor'


Fliplet also supports a custom '$filters' operator with some unique conditional logic such as case-insensitive match or date & time comparison. See example below.

A few examples to get you started:

// Find records where column "sum" is greater than 10 and column "name"
// is either "Nick" or "Tony"
connection.find({
  where: {
    sum: { $gt: 10 },
    name: { $in: ['Nick', 'Tony'] }
  }
});

// Find a case insensitive and partial match to the "Email" column. For e.g. it will match with bobsmith@email.com or Bobsmith@email.com or smith@email.com
connection.find({
  where: {
    Email: { $iLike: 'BobSmith@email.com' }
  }
});

// Find records where column "email" matches the domain "example.org"
connection.find({
  where: {
    email: { $regex: /example\.org$/i }
  }
});

// Nested queries using the $or operator: find records where either "name" is "Nick"
// or "address" is "UK" and "name" is "Tony"
connection.find({
  where: {
    $or: [
      { name: 'Nick' },
      { address: 'UK', name: 'Tony' }
    ]
  }
});

// Find records where the column "country" is not "Germany" or "France"
// and "createdAt" is on or after a specific date
connection.find({
  where: {
    country: { $nin: ['Germany', 'France'] },
    createdAt: { $gte: '2018-03-20' }
  }
});

// Use Fliplet's custom $filters operator
// The "==" and "contains" conditions are optimized to perform better with Fliplet's database
connection.find({
  where: {
    // Find entries that match ALL of the following conditions
    $filters: [
      // Find entries with a case insensitive match on the column
      {
        column: 'Email',
        condition: '==',
        value: 'user@email.com'
      },
      // Find entries where the column does not match the value
      {
        column: 'Email',
        condition: '!=',
        value: 'user@email.com'
      },
      // Find entries where the column is greater than the value
      {
        column: 'Size',
        condition: '>',
        value: 10
      },
      // Find entries where the column is greater than or equal to the value
      {
        column: 'Size',
        condition: '>=',
        value: 10
      },
      // Find entries where the column is less than the value
      {
        column: 'Size',
        condition: '<',
        value: 10
      },
      // Find entries where the column is less than or equal to the value
      {
        column: 'Size',
        condition: '<=',
        value: 10
      },
      // Find entries with a case insensitive partial match on the column
      {
        column: 'Email',
        condition: 'contains',
        value: '@email.com'
      },
      // Find entries where the column is empty based on _.isEmpty()
      {
        column: 'Tags',
        condition: 'empty'
      },
      // Find entries where the column is not empty based on _.isEmpty()
      {
        column: 'Tags',
        condition: 'notempty'
      },
      // Find entries where the column is in between 2 numeric values (inclusive)
      {
        column: 'Size',
        condition: 'between',
        value: {
          from: 10,
          to: 20
        }
      },
      // Find entries where the column is one of the values
      {
        column: 'Category',
        condition: 'oneof',
        // value can also be a CSV string
        value: ['News', 'Tutorial']
      },
      // Find entries where the column matches a date comparison
      {
        column: 'Birthday',
        // Use dateis, datebefore or dateafter to match
        // dates before and after the comparison value
        condition: 'dateis',
        value: '1978-04-30'
        // Optionally provide a unit of comparison:
        //  - year
        //  - quarter
        //  - month
        //  - week
        //  - day
        //  - hour
        //  - minute
        //  - second
        // unit: 'month'
      },
      // Find entries where the column is before the a certain time of the day
      {
        column: 'Start time',
        condition: 'datebefore',
        value: '17:30'
      },
      // Find entries where the column is after a timestamp
      {
        column: 'Birthday',
        condition: 'dateafter',
        // Provide a full timestamp for comparison in YYYY-MM-DD HH:mm format
        value: '2020-03-10 13:03'
      },
      // Find entries where the column is between 2 dates (inclusive)
      {
        column: 'Birthday',
        condition: 'datebetween',
        from: {
          value: '1978-01-01'
        },
        to: {
          value: '1978-12-31'
        }
      }
    ]
  }
});

### Insert a single record into the data source

To insert a record into a data source, use the 'connection.insert' method by passing the data to be inserted as a **JSON** object or a **FormData** object.

// Using a JSON object
connection.insert({
  name: 'Bill'
});

### Format of data returned from JS API

If referencing data from a data source, the entry will be found under the "data" object as shown below. 

{
"id": 404811749,
"data": {
"Email": "hrenfree1t@hugedomains.com",
"Title": "Manager",
"Prefix": "Mrs",
"Last Name": "Renfree",
"Department": "Operations",
"First Name": "Hayley",
"Middle Name": "Issy"
},
"order": 0,
"createdAt": "2025-02-19T17:13:51.507Z",
"updatedAt": "2025-02-19T17:13:51.507Z",
"deletedAt": null,
"dataSourceId": 1392773
}

These are the list of columns in the data source selected by the user: ${dataSourceColumns}, you must one of these when referencing data from a data source. 

If you are asked to build a feature that requires navigating the user to another screen use the navigate JS API to do this: 

Fliplet.Navigate.screen('Menu') where it accepts the screen name as a parameter. 

If you want to show a message to the end user do not use alerts but use our toast message library; The JS API is Fliplet.UI.Toast(message) where message is the text you want to show the user. 

If you want to get the logged-in user's details, you can use the following endpoint: 
Fliplet.User.getCachedSession().then(function (session) {
  var user = _.get(session, 'entries.dataSource.data');

  if (!user) {
    return; // user is not logged in
  }

  // contains all columns found on the connected dataSource entry for user.Email
  console.log(user);
});

If you are asked to join data across multiple data sources then use the below JS API:

Both DataSources JS APIs and REST APIs allow you to fetch data from more than one dataSource using a featured called “join”, heavily inspired by traditional joins made in SQL databases.

Joins are defined by a unique name and their configuration options; any number of joins can be defined when fetching data from one data source:

Fliplet.DataSources.connect(123).then(function (connection) {
  // 1. Extract articles from dataSource 123
  return connection.find({
    join: {
      // ... with their comments
      Comments: { options },

      // ... and users who posted them
      Users: { options }
    }
  })
}).then(console.log)
Before we dive into complete examples, let’s start with the three types of joins we support.

Types of joins
Left join (default)
Use this when you want to fetch additional data for your dataSource. Examples include things like getting the list of comments and likes for a list of articles.

Left joins must be defined by specifying:

the target dataSource ID with the dataSourceId parameter (or dataSourceName if you want to connect by using the data source name)
what data should be used to reference entries from the initial dataSource to the joined dataSource, using the on parameter, where the key is the column name from the source table and the value is the column name of the target (joined) table.
Consider an example where two dataSources are created as follows:

Articles
ID	Title
1	A great blog post
2	Something worth reading
Comments
ArticleID	Comment text	Likes
1	Thanks! This was worth reading.	5
1	Loved it, would read it again.	2
We can simply reference the entries between the two dataSources as follows:

connection.find({
  join: {
    Comments: {
      dataSourceId: 123,
      on: {
        'data.ID': 'data.ArticleID'
      }
    }
  }
})
Inner join
Use this when the entries of your dataSource should only be returned when there are matching entries from the join operations. Tweaking the above example, you might want to use this when you want to extract the articles and their comments and make sure only articles with at least one comment are returned.

Inner joins are defined like left joins but with the required attribute set to true:

connection.find({
  join: {
    Comments: {
      dataSourceId: 123,
      on: {
        'data.ID': 'data.ArticleID'
      },
      required: true
    }
  }
})
Outer join
Use this when you want to merge entries from the joined dataSource(s) to the ones being extracted from your dataSource. The result will simply be a concatenation of both arrays.

Outer joins are similar to other joins in regards to how they are defined, but don’t need the on parameter defined since they don’t need to reference entries between the two dataSources:

connection.find({
  join: {
    MyOtherArticles: {
      dataSourceId: 789
    }
  }
})
Types of data returned in joins
Joins can return data in several different ways:

An Array of the matching entries. This is the default behaviour for joins.
A Boolean to indicate whether at least one entry was matched.
A Count of the matched entries.
A Sum taken by counting a number in a defined column from the matching entries.
Array (join)
This is the default return behaviour for joins, hence no parameters are required.

Example input:

connection.find({
  join: {
    Comments: {
      dataSourceId: 123,
      on: {
        'data.ID': 'data.ArticleID'
      }
    }
  }
})
Example of the returned data:

[
  {
    id: 1,
    dataSourceId: 456,
    data: { Title: 'A great blog post' },
    join: {
      Comments: [
        {
          id: 3,
          dataSourceId: 123,
          data: { ArticleID: 1, 'Comment text': 'Thanks! This was worth reading.', Likes: 5 }
        },
        {
          id: 4,
          dataSourceId: 123,
          data: { ArticleID: 1, 'Comment text': 'Loved it, would read it again.', Likes: 2 }
        }
      ]
    }
  }
]
Boolean (join)
When the has parameter is set to true, a boolean will be returned to indicate whether at least one entry was matched from the joined entries.

Example input:

connection.find({
  join: {
    HasComments: {
      dataSourceId: 123,
      on: {
        'data.ID': 'data.ArticleID'
      },
      has: true
    }
  }
})
Example of the returned data:

[
  {
    id: 1,
    dataSourceId: 456,
    data: { Title: 'A great blog post' },
    join: {
      HasComments: true
    }
  },
  {
    id: 2,
    dataSourceId: 456,
    data: { Title: 'Something worth reading' },
    join: {
      HasComments: false
    }
  }
]
Count (join)
When the count parameter is set to true, a count of the matching entries will be returned.

Example input:

connection.find({
  join: {
    NumberOfComments: {
      dataSourceId: 123,
      on: {
        'data.ID': 'data.ArticleID'
      },
      count: true
    }
  }
})
Example of the returned data:

[
  {
    id: 1,
    dataSourceId: 456,
    data: { Title: 'A great blog post' },
    join: {
      NumberOfComments: 2
    }
  },
  {
    id: 2,
    dataSourceId: 456,
    data: { Title: 'Something worth reading' },
    join: {
      NumberOfComments: 0
    }
  }
]
Sum (join)
When the sum parameter is set to the name of a column, a sum taken by counting the number of all matching entries for such column will be returned.

Example input:

connection.find({
  join: {
    LikesForComments: {
      dataSourceId: 123,
      on: {
        'data.ID': 'data.ArticleID'
      },
      sum: 'Likes'
    }
  }
})
Example of the returned data:

[
  {
    id: 1,
    dataSourceId: 456,
    data: { Title: 'A great blog post' },
    join: {
      LikesForComments: 7
    }
  },
  {
    id: 2,
    dataSourceId: 456,
    data: { Title: 'Something worth reading' },
    join: {
      LikesForComments: 0
    }
  }
]
Filtering data
Use the where parameter to define a filtering query for the data to be selected on a particular join. This support the same exact syntax as connection.find({ where }):

connection.find({
  join: {
    LikesForPopularComments: {
      dataSourceId: 123,
      on: {
        'data.ID': 'data.ArticleID'
      },
      where: {
        // only fetch a comment when it has more than 10 likes
        Likes: { $gt: 10 }
      }
    }
  }
})
Only fetch a list of attributes
Use the attributes parameter to define which fields should only be returned from the data in the joined entries:

connection.find({
  join: {
    LikesForComments: {
      dataSourceId: 123,
      on: {
        'data.ID': 'data.ArticleID'
      },
      // only fetch the comment text
      attributes: ['Comment text']
    }
  }
})
Limit the number of returned entries
Use the limit parameter to define how many entries should be returned at most for your join:

connection.find({
  join: {
    LikesForComments: {
      dataSourceId: 123,
      on: {
        'data.ID': 'data.ArticleID'
      },
      // only fetch up to 5 comments at most
      limit: 5
    }
  }
})
Order the entries returned
Use the order parameter to define the order at which entries are returned for your join.

Note: this parameter can be used for attributes such as "id" and "createdAt". If you need to order by actual data in your entry, use the "data." prefix (such as data.Title).

connection.find({
  join: {
    MostRecentComments: {
      dataSourceId: 123,
      on: {
        'data.ID': 'data.ArticleID'
      },
      // only fetch the 5 most recent comments, combining order and limit
      order: ['createdAt', 'DESC'],
      limit: 5
    }
  }
})
Connecting to a data source by name
Use the dataSourceName parameter to connect to a data source by its name instead of ID:

connection.find({
  join: {
    LikesForComments: {
      dataSourceName: 'User comments',
      on: {
        'data.ID': 'data.ArticleID'
      },
      // only fetch the comment text
      attributes: ['Comment text']
    }
  }
})
`;

  return Fliplet.AI.createCompletion({
    model: "o3-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    reasoning_effort: "low",
  }).then(function (result) {
    // Parse the response
    const response = result.choices[0].message.content;

    // Initialize variables
    let html = "";
    let css = "";
    let javascript = "";

    // Extract HTML
    const htmlMatch = response.match(/### HTML\n([\s\S]*?)(?=### CSS|$)/);
    if (htmlMatch) {
      html = htmlMatch[1].trim();
    }

    // Extract CSS
    const cssMatch = response.match(/### CSS\n([\s\S]*?)(?=### JavaScript|$)/);
    if (cssMatch) {
      css = cssMatch[1].trim();
    }

    // Extract JavaScript
    const jsMatch = response.match(/### JavaScript\n([\s\S]*?)(?=$)/);
    if (jsMatch) {
      javascript = jsMatch[1].trim();
    }

    return {
      html,
      css,
      javascript,
    };
  });
}

function saveGeneratedCode(parsedContent) {
  Fliplet.Helper.field("layoutHTML").set(parsedContent.html);
  Fliplet.Helper.field("css").set(parsedContent.css);
  Fliplet.Helper.field("javascript").set(parsedContent.javascript);
  Fliplet.Helper.field("regenerateCode").set(true);

  var data = Fliplet.Widget.getData();
  data.fields.dataSourceId = selectedDataSourceId;
  data.fields.dataSourceName = selectedDataSourceName;
  data.fields.prompt = Fliplet.Helper.field("prompt").get();
  data.fields.layoutHTML = parsedContent.html;
  data.fields.css = parsedContent.css;
  data.fields.javascript = parsedContent.javascript;
  data.fields.regenerateCode = true;

  return Fliplet.Widget.save(data.fields).then(function () {
    Fliplet.Studio.emit("reload-widget-instance", widgetId);
    toggleLoader(false);
    setTimeout(function () {
      Fliplet.Helper.field("regenerateCode").set(false);
      data.fields.regenerateCode = false;
      Fliplet.Widget.save(data.fields);
    }, 1000);
  });
}
