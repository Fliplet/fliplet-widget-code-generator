Fliplet.Widget.generateInterface({
  fields: [
    {
      name: 'aiModel',
      type: 'text',
      label: 'AI model',
      default: 'gpt-4o'
    },
    {
      name: 'prompt',
      type: 'textarea',
      label: 'Prompt',
      default: '',
      rows: 12
    }
  ]
});