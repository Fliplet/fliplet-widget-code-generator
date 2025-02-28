// Register this widget instance
Fliplet.Widget.instance({
  name: "code-generator-dev",
  displayName: "Code generator",
  render: {
    template: ['<div class="code-generator-content">', "</div>"].join(""),
    ready: function () {
      // Initialize children components when this widget is ready
      Fliplet.Widget.initializeChildren(this.$el, this);

      const AI = this;
      const appId = Fliplet.Env.get("appId");
      const pageId = Fliplet.Env.get("pageId");
      const $aiContainer = $(this.$el).find(".code-generator-content");

      AI.fields = _.assign(
        {
          dataSourceId: "",
          prompt: "",
          css: "",
          javascript: "",
          layout: "",
          regenerateCode: false,
        },
        AI.fields
      );

      const widgetId = AI.fields.codeGeneratorDevId;

      if (!AI.fields.dataSourceId || !AI.fields.prompt) {
        Fliplet.UI.Toast("Please select a data source and enter a prompt");
        return;
      } else if (!AI.fields.regenerateCode) {
        return;
      }

      async function saveGeneratedCode(parsedContent) {
        try {
          // Save CSS and JavaScript
          const settingsResponse = await Fliplet.API.request({
            url: `v1/apps/${appId}/pages/${pageId}/settings`,
            method: "POST",
            data: {
              customSCSS: parsedContent.css,
              customJS: parsedContent.javascript,
            },
          });

          // Save HTML
          $aiContainer.html(AI.fields.layout.replace(/^"|"$/g, "`"));

          return { settingsResponse };
        } catch (error) {
          console.error("Error saving code:", error);
          throw error;
        }
      }

      if (AI.fields.css && AI.fields.javascript && AI.fields.layout) {
        var parsedContent = {
          css: `/* start code generator ${widgetId} */\n ${AI.fields.css} \n/* end code generator ${widgetId} */`,
          javascript: `// start code generator ${widgetId}\n ${AI.fields.javascript} \n// end code generator ${widgetId}`,
          layout: `/* start code generator ${widgetId} */\n ${AI.fields.layout} \n/* end code generator ${widgetId} */`,
        };

        saveGeneratedCode(parsedContent);
      }
    },
  },
});
