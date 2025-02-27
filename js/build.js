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
      debugger
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

      debugger;

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
          $aiContainer.html(AI.fields.layout);

          return { settingsResponse };
        } catch (error) {
          console.error("Error saving code:", error);
          throw error;
        }
      }

      if (!AI.fields.dataSourceId || !AI.fields.prompt) {
        Fliplet.UI.Toast("Please select a data source and enter a prompt");
        return;
      }

      if (
        AI.fields.css &&
        AI.fields.javascript &&
        AI.fields.layout &&
        AI.fields.regenerateCode
      ) {
        var parsedContent = {
          css: AI.fields.css,
          javascript: AI.fields.javascript,
          layout: AI.fields.layout,
        };

        saveGeneratedCode(parsedContent);
      }
    },
    // },
  },
});
