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
  ],
});

function generateCode() {
  // Fliplet.Widget.complete();
  var data = Fliplet.Widget.getData();
  data.fields.dataSourceId = selectedDataSourceId;
  data.configuration.fields[0].value = selectedDataSourceId;
  // debugger
  Fliplet.Widget.save(data.fields).then(function () {
    // Fliplet.Helper.field("dataSourceId").set(selectedDataSourceId);
    // Fliplet.Helper.field("prompt").set('test');
    Fliplet.Studio.emit("reload-widget-instance", widgetId);
  });
}
