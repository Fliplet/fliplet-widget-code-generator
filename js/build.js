// Register this widget instance
Fliplet.Widget.instance({
  name: "code-generator-dev",
  displayName: "Code generator",
  render: {
    template: '<div class="code-generator-content"></div>',
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
        // todo add old custom code from the page
        try {

          const currentSettings = await Fliplet.API.request({
            url: `v1/apps/${appId}/pages/${pageId}?richLayout`,
            method: "GET",
          });

          debugger;
          // Save CSS and JavaScript
          const settingsResponse = await Fliplet.API.request({
            url: `v1/apps/${appId}/pages/${pageId}/settings`,
            method: "POST",
            data: {
              customSCSS: updateCodeWithinDelimiters('css', parsedContent.css, currentSettings.page.settings.customSCSS), // Inject CSS code
              customJS: updateCodeWithinDelimiters('js', parsedContent.javascript, currentSettings.page.settings.customJS), // Inject JavaScript code
            },
          });

          // Save HTML
          // $aiContainer.html(updateCodeWithinDelimiters('layout', parsedContent.layout, '')); // Inject HTML code
          $aiContainer.html(); // Inject HTML code
          $aiContainer.append(parsedContent.layout); // Inject HTML code

          return { settingsResponse };
        } catch (error) {
          console.error("Error saving code:", error);
          throw error;
        }
      }

      function updateCodeWithinDelimiters(type, newCode, oldCode = '') {
        let start, end;
        
        if (type == 'js') {
          start = `// start code generator ${widgetId}`;
          end = `// end code generator ${widgetId}`;
        } else {
          start = `/* start code generator ${widgetId} */`;
          end = `/* end code generator ${widgetId} */`;
        }

        // Check if delimiters exist in the old code
        if (oldCode.includes(start) && oldCode.includes(end)) {
          // Replace content between delimiters
          return oldCode.replace(start + '[\s\S]*?' + end, start + '\n' + newCode + '\n' + end);
        } else {
          // Append new code with delimiters at the end
          return oldCode + '\n\n' + start + '\n' + newCode + '\n' + end;
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
