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
  ],
});

function generateCode() {
  const prompt = Fliplet.Helper.field("prompt");
  const dataSourceId = Fliplet.Helper.field("dataSourceId");
  if (!prompt || !dataSourceId) {
    Fliplet.UI.toast("Please enter a prompt and select a data source");
    return;
  }
  queryAI(prompt).then(function (parsedContent) {
    saveGeneratedCode(parsedContent);
  });
}

function queryAI(prompt) {
  return Fliplet.AI.createCompletion({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0,
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
  return Fliplet.API.request({
    url: `v1/apps/${appId}/pages/${pageId}/settings`,
    method: "POST",
    data: {
      customSCSS: parsedContent.css,
      customJS: parsedContent.javascript,
    },
  }).then(function (response) {
    const layoutResponse = parsedContent.html;
    $aiContainer.html(`<div class="generated-code">${layoutResponse}</div>`);

    return { settingsResponse, layoutResponse };
  });
}
