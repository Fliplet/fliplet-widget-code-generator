var selectedDataSourceId = null;
var widgetId = Fliplet.Widget.getDefaultId();

Fliplet.Widget.generateInterface({
  fields: [
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
    },
    {
      type: "html",
      html: '<input type="button" class="btn btn-primary generate-code" value="Generate code" />',
      ready: function () {
        $(this.$el).find(".generate-code").on("click", generateCode);
      },
    },
    {
      name: "css",
      type: "textarea",
      label: "CSS",
      default: "",
      rows: 12,
    },
    {
      name: "javascript",
      type: "textarea",
      label: "JavaScript",
      default: "",
      rows: 12,
    },
    {
      name: "layout",
      type: "textarea",
      label: "Layout",
      default: "",
      rows: 12,
    },
    {
      type: 'checkbox',
      name: 'regenerateCode',
      label: 'Regenerate code',
      default: false,
    }
  ],
});

function generateCode() {
  var prompt = Fliplet.Helper.field("prompt").get();
  if (selectedDataSourceId && prompt) {
    return queryAI(prompt)
      .then(function (parsedContent) {
        // Save the generated code
        return saveGeneratedCode(parsedContent);
      })
      .catch(function (error) {
        console.error("Error in process:", error);
        return Promise.reject(error);
      });
  } else {
    Fliplet.Studio.emit("reload-widget-instance", widgetId);
  }
}

function queryAI(prompt) {
  const result = Fliplet.AI.createCompletion({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0,
  });

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
}

function saveGeneratedCode(parsedContent) {
  Fliplet.Helper.field("layout").set(parsedContent.html);
  Fliplet.Helper.field("css").set(parsedContent.css);
  Fliplet.Helper.field("javascript").set(parsedContent.javascript);
  Fliplet.Helper.field("regenerateCode").set(true);

  var data = Fliplet.Widget.getData();
  data.fields.dataSourceId = selectedDataSourceId;
  data.fields.prompt = prompt;
  data.fields.layout = parsedContent.html;
  data.fields.css = parsedContent.css;
  data.fields.javascript = parsedContent.javascript;

  Fliplet.Widget.save(data.fields).then(function () {
    Fliplet.Studio.emit("reload-widget-instance", widgetId);
    Fliplet.Helper.field("regenerateCode").set(false);
  });
}


let systemPrompt = `You are to only return the HTML, CSS, JS for the following user request. 

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
  const div = document.querySelector('div');
  div.style.color = 'blue';
});

For the HTML do not include any head tags, just return the html for the body. 
Use bootstrap for css and styling.
Do not include any backticks in the response.
Ensure there are no syntax errors in the code and that column names with spaced in them are wrapped with square brackets.
Add inline comments for the code so technical users can make edits to the code. 
Add try catch blocks in the code to catch any errors and log the errors to the console. 
Ensure you chain all the promises correctly with return statements.

If you get asked to use datasource js api for e.g. if you need to save data from a form to a datasource or need to read data dynamic data to show it on the screen you need to use the following api's: 

### Connect to a data source by its name using the 'connectByName' method.

Fliplet.DataSources.connectByName(dataSourceName).then(function (connection) {
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

  - '$in', '$nin', '$exists', '$gte', '$gt', '$lte', '$lt', '$eq', '$ne', '$iLike', '$mod', '$all', '$and', '$or', $nor'


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
  id: 3,
  name: 'Bill'
});

### Format of data returned from JS API

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

If you asked to build a feature that requires navigating the user to another screen use the navigate JS API to do this: 

Fliplet.Navigate.screen('Menu') where it accepts the screen name as a parameter.`;

