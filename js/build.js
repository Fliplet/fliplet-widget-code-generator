// Register this widget instance
Fliplet.Widget.instance({
  name: "code-generator-dev",
  displayName: "Code generator",
  render: {
    template: '<div class="code-generator-content"></div>',
    ready: function () {
      // Initialize children components when this widget is ready
      Fliplet.Widget.initializeChildren(this.$el, this);

      const $el = $(this);
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
          layoutHTML: "",
          regenerateCode: false,
        },
        AI.fields
      );

      const widgetId = AI.fields.codeGeneratorDevId;

      if (!AI.fields.prompt) {
        Fliplet.UI.Toast("Please enter a prompt");
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

          // code from AI
          var codeGenContainer = `<div class="code-gen-${widgetId}">${parsedContent.layoutHTML}</div>`;

          // Wrap response inside a temporary container
          let $wrapper = $("<div>").html(currentSettings.page.richLayout);

          // remove existing code gen container
          $wrapper.find(`.code-gen-${widgetId}`).remove();

          // Find `<fl-code-generator-dev>` and add a sibling after it
          $wrapper.find("fl-code-generator-dev").after(codeGenContainer);

          const layoutResponse = await Fliplet.API.request({
            url: `v1/apps/${appId}/pages/${pageId}/rich-layout`,
            method: "PUT",
            data: {
              richLayout: $wrapper.html(),
            },
          });

          // save logs
          const logAiCallResponse = await logAiCall({
            prompt: AI.fields.prompt,
            aiCssResponse: AI.fields.css,
            aiJsResponse: AI.fields.javascript,
            aiLayoutResponse: AI.fields.layoutHTML,
          });

          if (Fliplet.Env.get("mode") == "interact") {
            Fliplet.UI.Toast("Code generated successfully");
          }

          return { layoutResponse };
          // return { settingsResponse, layoutResponse };
        } catch (error) {
          console.error("Error saving code:", error);
          throw error;
        }
      }

      function logAiCall(data) {
        return Fliplet.API.request({
          url: `v1/organizations/${organizationId}/logs`,
          method: "POST",
          data: JSON.stringify({
            type: "ai.code.generator",
            data: data,
            userId: userId,
            appId: appId,
            organizationId: organizationId,
          }),
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
      } else {
        $aiContainer.html(parsedContent.layoutHTML); // Inject HTML code
      }
    },
  },
});

// Placing inside fl-code-generator component
// // Register this widget instance
// Fliplet.Widget.instance({
//   name: "code-generator-dev",
//   displayName: "Code generator",
//   render: {
//     template: '<div class="code-generator-content"></div>',
//     ready: function () {
//       // Initialize children components when this widget is ready
//       Fliplet.Widget.initializeChildren(this.$el, this);

//       const $el = $(this);
//       const AI = this;
//       const appId = Fliplet.Env.get("appId");
//       const pageId = Fliplet.Env.get("pageId");
//       const organizationId = Fliplet.Env.get("organizationId");
//       const userId = Fliplet.Env.get("user")?.id || "";
//       const $aiContainer = $(this.$el).find(".code-generator-content");

//       AI.fields = _.assign(
//         {
//           dataSourceId: "",
//           prompt: "",
//           css: "",
//           javascript: "",
//           layoutHTML: "",
//           regenerateCode: false,
//         },
//         AI.fields
//       );

//       const widgetId = AI.fields.codeGeneratorDevId;

//       if (!AI.fields.prompt) {
//         Fliplet.UI.Toast("Please enter a prompt");
//         return;
//       } else if (!AI.fields.regenerateCode) {
//         return;
//       }

//       async function saveGeneratedCode(parsedContent) {
//         try {
//           const currentSettings = await Fliplet.API.request({
//             url: `v1/apps/${appId}/pages/${pageId}?richLayout`,
//             method: "GET",
//           }).catch((error) => {
//             return Fliplet.UI.Toast("Error getting current settings: " + error);
//           });

//           // // Save CSS and JavaScript
//           // const settingsResponse = await Fliplet.API.request({
//           //   url: `v1/apps/${appId}/pages/${pageId}/settings`,
//           //   method: "POST",
//           //   data: {
//           //     customSCSS: updateCodeWithinDelimiters(
//           //       "css",
//           //       parsedContent.css,
//           //       currentSettings.page.settings.customSCSS
//           //     ), // Inject CSS code
//           //     customJS: updateCodeWithinDelimiters(
//           //       "js",
//           //       parsedContent.javascript,
//           //       currentSettings.page.settings.customJS
//           //     ), // Inject JavaScript code
//           //   },
//           // });

//           const layoutResponse = await Fliplet.API.request({
//             url: `v1/apps/${appId}/pages/${pageId}/rich-layout`,
//             method: "PUT",
//             data: {
//               richLayout: insertCodeIntoString(currentSettings.page.richLayout, widgetId, parsedContent.layoutHTML)
//             },
//           });

//           // // start form text component
//           // const data = {
//           //   html: parsedContent.layoutHTML,
//           // };

//           // await Fliplet.API.request({
//           //   url: `v1/widget-instances/${widgetId}`,
//           //   method: "PUT",
//           //   data,
//           // });

//           // Fliplet.Studio.emit("page-preview-send-event", {
//           //   type: "savePage",
//           // });

//           // Object.assign(AI.data, data);
//           // Object.assign(AI, data);

//           // Fliplet.Hooks.run("componentEvent", {
//           //   type: "render",
//           //   target: new Fliplet.Interact.ComponentNode($el),
//           // });
//           // end of form text component

//           // Save HTML in interface
//           $aiContainer.html(parsedContent.layoutHTML); // Inject HTML code
//           // $aiContainer.html("<div class='vvv'>some html</div>"); // Inject HTML code
//           // $aiContainer.html("some html"); // Inject HTML code

//           // TODO uncomment logs
//           // const logAiCall = await logAiCall({
//           //   prompt: AI.fields.prompt,
//           //   aiCssResponse: AI.fields.css,
//           //   aiJsResponse: AI.fields.javascript,
//           //   aiLayoutResponse: AI.fields.layout,
//           // });

//           return { layoutResponse };
//           // return { settingsResponse, layoutResponse };
//         } catch (error) {
//           console.error("Error saving code:", error);
//           throw error;
//         }
//       }

//       function insertCodeIntoString(originalString, cid, code) {
//         return originalString.replace(
//           new RegExp(
//             `<fl-code-generator-dev cid="${cid}"></fl-code-generator-dev>`
//           ),
//           `<fl-code-generator-dev cid="${cid}">${code}</fl-code-generator-dev>`
//         );
//       }

//       function logAiCall(data) {
//         return Fliplet.API.request({
//           url: `v1/apps/${appId}/logs`,
//           method: "POST",
//           data: {
//             type: "ai.code.generator",
//             data: aiCallData,
//             userId: userId,
//             appId: appId,
//             organizationId: organizationId,
//           },
//         });
//       }

//       function updateCodeWithinDelimiters(type, newCode, oldCode = "") {
//         let start, end;

//         if (type == "js") {
//           start = `// start code generator ${widgetId}`;
//           end = `// end code generator ${widgetId}`;
//         } else {
//           start = `/* start code generator ${widgetId} */`;
//           end = `/* end code generator ${widgetId} */`;
//         }

//         // Check if delimiters exist in the old code
//         if (oldCode.includes(start) && oldCode.includes(end)) {
//           // Replace content between delimiters
//           return oldCode.replace(
//             new RegExp(start + "[\\s\\S]*?" + end, "g"),
//             start + "\n" + newCode + "\n" + end
//           );
//         } else {
//           // Append new code with delimiters at the end
//           return oldCode + "\n\n" + start + "\n" + newCode + "\n" + end;
//         }
//       }

//       var parsedContent = {
//         css: AI.fields.css,
//         javascript: AI.fields.javascript,
//         layoutHTML: AI.fields.layoutHTML,
//       };

//       if (AI.fields.css && AI.fields.javascript && AI.fields.layoutHTML) {
//         saveGeneratedCode(parsedContent);
//       } else {
//         $aiContainer.html(parsedContent.layoutHTML); // Inject HTML code
//       }
//     },
//   },
// });
