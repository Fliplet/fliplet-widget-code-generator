Fliplet.Widget.generateInterface({
  fields: [
    {
      type: 'provider',
      name: 'dataSourceId',
      package: 'com.fliplet.data-source-provider',
      data: function(value) {
        return {
          dataSourceTitle: 'Data source',
          dataSourceId: value,
          appId: Fliplet.Env.get('appId'),
          default: {
            name: 'Data source',
            entries: [],
            columns: []
          },
          accessRules: [
            {
              allow: 'all',
              type: [
                'select'
              ]
            }
          ]
        };
      },
      beforeSave: function(value) {
        return value && value.id;
      }
    },
    {
      name: 'prompt',
      type: 'textarea',
      label: 'Prompt',
      default: '',
      rows: 12
    },
    {
      name: 'generateCode',
      type: 'html',
      html: '<button class="btn btn-primary">Generate code</button>',
      ready: function() {
        this.el.addEventListener('click', function() {
          alert('Generate code');
        });
      }
    }
  ]
});