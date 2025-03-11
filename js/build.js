// Register this widget instance
Fliplet.Widget.instance({
  name: "ai-feature",
  displayName: "AI feature",
  render: {
    template: '<div class="ai-feature-content"></div>',
    ready: function () {
      // Initialize children components when this widget is ready
      Fliplet.Widget.initializeChildren(this.$el, this);

      const AI = this;
      const appId = Fliplet.Env.get("appId");
      const pageId = Fliplet.Env.get("pageId");
      const organizationId = Fliplet.Env.get("organizationId");
      const userId = Fliplet.Env.get("user")?.id || "";

      AI.fields = _.assign(
        {
          dataSourceId: "",
          prompt: "",
          css: "",
          javascript: "",
          layoutHTML: "",
          regenerateCode: false,
        },
        AI.fields
      );

      // event.type == 'removed'
      // event.removed[0].widgetId

      const widgetId = AI.fields.aiFeatureId;

      // Fliplet.Hooks.on("componentEvent", async function (event) {
      //   if (
      //     event?.type == "removed" &&
      //     widgetId == event?.removed[0]?.widgetId
      //   ) {
      //     var currentSettings = await getCurrentPageSettings();

      //     // reload page preview
      //     Fliplet.Studio.emit("reload-page-preview");
      //   }
      // });

      if (!AI.fields.prompt) {
        Fliplet.UI.Toast("Please enter a prompt");
        return;
      } else if (!AI.fields.regenerateCode) {
        return;
      }

      async function getCurrentPageSettings() {
        return await Fliplet.API.request({
          url: `v1/apps/${appId}/pages/${pageId}?richLayout`,
          method: "GET",
        }).catch((error) => {
          return Fliplet.UI.Toast("Error getting current settings: " + error);
        });
      }

      async function saveCssAndJs(css, js) {
        var response = await Fliplet.API.request({
          url: `v1/apps/${appId}/pages/${pageId}/settings`,
          method: "POST",
          data: {
            customSCSS: css, // Inject CSS code
            customJS: js, // Inject JavaScript code
          },
        });

        return response;
      }

      async function saveLayout(html) {
        return await Fliplet.API.request({
          url: `v1/apps/${appId}/pages/${pageId}/rich-layout`,
          method: "PUT",
          data: { richLayout: html },
        });
      }

      async function saveGeneratedCode(parsedContent) {
        try {
          // get current page settings
          const currentSettings = await getCurrentPageSettings();

          // Save CSS and JavaScript
          const settingsResponse = await saveCssAndJs(
            updateCodeWithinDelimiters(
              "css",
              parsedContent.css,
              currentSettings.page.settings.customSCSS
            ), // Inject CSS code
            updateCodeWithinDelimiters(
              "js",
              parsedContent.javascript,
              currentSettings.page.settings.customJS
            )
          );

          const htmlCodeToInject = injectHtmlCode(currentSettings);

          const layoutResponse = await saveLayout(htmlCodeToInject);

          // save logs
          const logAiCallResponse = await logAiCall({
            prompt: AI.fields.prompt,
            aiCssResponse: AI.fields.css,
            aiJsResponse: AI.fields.javascript,
            aiLayoutResponse: AI.fields.layoutHTML,
          });

          // reload page preview
          Fliplet.Studio.emit("reload-page-preview");

          return { settingsResponse, layoutResponse, logAiCallResponse };
        } catch (error) {
          throw error;
        }
      }

      function injectHtmlCode(currentSettings) {
        // code from AI
        var codeGenContainer = `<div class="ai-feature-${widgetId}">${parsedContent.layoutHTML}</div>`;
        // Wrap response inside a temporary container
        let $wrapper = $("<div>").html(currentSettings.page.richLayout);
        // remove existing ai feature container
        $wrapper.find(`.ai-feature-${widgetId}`).remove();
        // Find `<fl-ai-feature>` and add a sibling after it
        $wrapper.find("fl-ai-feature").after(codeGenContainer);
        return $wrapper.html();
      }

      function logAiCall(data) {
        return Fliplet.App.Logs.create({
          data: {
            type: "ai.code.feature",
            data: data,
            userId: userId,
            appId: appId,
            organizationId: organizationId,
          },
        });
      }

      function updateCodeWithinDelimiters(type, newCode, oldCode = "") {
        let start, end;

        if (type == "js") {
          start = `// start-ai-feature ${widgetId}`;
          end = `// end-ai-feature ${widgetId}`;
        } else {
          start = `/* start-ai-feature ${widgetId} */`;
          end = `/* end-ai-feature ${widgetId} */`;
        }

        // Check if delimiters exist in the old code
        if (oldCode.includes(start) && oldCode.includes(end)) {
          // Replace content between delimiters
          return oldCode.replace(
            new RegExp(start + "[\\s\\S]*?" + end, "g"),
            start + "\n" + newCode + "\n" + end
          );
        } else {
          // Append new code with delimiters at the end
          return oldCode + "\n\n" + start + "\n" + newCode + "\n" + end;
        }
      }

      var parsedContent = {
        css: AI.fields.css,
        javascript: AI.fields.javascript,
        layoutHTML: AI.fields.layoutHTML,
      };

      if (AI.fields.css && AI.fields.javascript && AI.fields.layoutHTML) {
        saveGeneratedCode(parsedContent);
      }
    },
  },
});
