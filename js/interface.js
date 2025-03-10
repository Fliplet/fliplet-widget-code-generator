Fliplet.Widget.generateInterface({
  fields: [
    {
      name: 'aiModel',
      type: 'text',
      label: 'AI model',
      default: 'o3-mini'
    },
    {
      name: 'prompt',
      type: 'textarea',
      label: 'Prompt',
      default: ''
    }
  ]
});