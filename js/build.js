// Register this widget instance
Fliplet.Widget.instance({
  name: "code-generator",
  displayName: "Code generator",
  render: {
    template: [
      '<div class="code-generator-content">',
      "</div>",
    ].join(""),
    ready: function () {
      // Initialize children components when this widget is ready
      Fliplet.Widget.initializeChildren(this.$el, this);

      const AI = this;
      const $aiContainer = $(document).find(".code-generator-content");

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

      // if (
      //   AI.fields.dataSourceId &&
      //   AI.fields.prompt
      // ) {
        
      //   $aiContainer.html(`
      //     <div class="overlay-loading">
      //       <p>Generating code, please wait...</p>
      //     </div>
      //   `);

      //   return queryAI(AI.fields.prompt)
      //     .then(function (parsedContent) {
      //       // Save the generated code
      //       return saveGeneratedCode(parsedContent);
      //     })
      //     .then(() => {
      //       // Reload the page to show the newly generated content
      //       // window.location.reload();
      //     })
      //     .catch(function (error) {
      //       console.error("Error in process:", error);
      //       return Promise.reject(error);
      //     });
      }
    // },
  },
});
