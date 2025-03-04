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
      const organizationId = Fliplet.Env.get("organizationId");
      const userId = Fliplet.Env.get("user")?.id || "";
      const $aiContainer = $(this.$el).find(".code-generator-content");

      AI.fields = _.assign(
        {
          dataSourceId: "",
          prompt: "",
          css: "",
          javascript: "",
          layoutt: "",
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
          const currentSettings = await Fliplet.API.request({
            url: `v1/apps/${appId}/pages/${pageId}?richLayout`,
            method: "GET",
          }).catch((error) => {
            return Fliplet.UI.Toast("Error getting current settings: " + error);
          });

          // Save CSS and JavaScript
          const settingsResponse = await Fliplet.API.request({
            url: `v1/apps/${appId}/pages/${pageId}/settings`,
            method: "POST",
            data: {
              customSCSS: updateCodeWithinDelimiters(
                "css",
                parsedContent.css,
                currentSettings.page.settings.customSCSS
              ), // Inject CSS code
              customJS: updateCodeWithinDelimiters(
                "js",
                parsedContent.javascript,
                currentSettings.page.settings.customJS
              ), // Inject JavaScript code
            },
          });

          // const layoutResponse = await Fliplet.API.request({
          //   url: `v1/apps/${appId}/pages/${pageId}/rich-layout`,
          //   method: "PUT",
          //   data: {
          //     richLayout: currentSettings.page.settings.richLayout // parsedContent.layout,
          //   },
          // });

          // Save HTML
          // $aiContainer.html(parsedContent.layout); // Inject HTML code
          // $aiContainer.html("<div class='vvv'>some html</div>"); // Inject HTML code
          $aiContainer.html("some html"); // Inject HTML code

          // const logAiCall = await logAiCall({
          //   prompt: AI.fields.prompt,
          //   aiCssResponse: AI.fields.css,
          //   aiJsResponse: AI.fields.javascript,
          //   aiLayoutResponse: AI.fields.layout,
          // });

          return { settingsResponse };
        } catch (error) {
          console.error("Error saving code:", error);
          throw error;
        }
      }

      function logAiCall(aiCallData) {
        return Fliplet.API.request({
          url: `v1/apps/${appId}/logs`,
          method: "POST",
          data: {
            type: "ai.code.generator",
            data: aiCallData,
            userId: userId,
            appId: appId,
            organizationId: organizationId,
          },
        });
      }

      function updateCodeWithinDelimiters(type, newCode, oldCode = "") {
        let start, end;

        if (type == "js") {
          start = `// start code generator ${widgetId}`;
          end = `// end code generator ${widgetId}`;
        } else {
          start = `/* start code generator ${widgetId} */`;
          end = `/* end code generator ${widgetId} */`;
        }

        // Check if delimiters exist in the old code
        if (oldCode.includes(start) && oldCode.includes(end)) {
          // Replace content between delimiters
          return oldCode.replace(
            start + "[sS]*?" + end,
            start + "\n" + newCode + "\n" + end
          );
        } else {
          // Append new code with delimiters at the end
          return oldCode + "\n\n" + start + "\n" + newCode + "\n" + end;
        }
      }

      if (AI.fields.css && AI.fields.javascript && AI.fields.layoutt) {
        var parsedContent = {
          css: AI.fields.css,
          javascript: AI.fields.javascript,
          layoutt: AI.fields.layoutt,
        };

        saveGeneratedCode(parsedContent);
      }
    },
  },
});
