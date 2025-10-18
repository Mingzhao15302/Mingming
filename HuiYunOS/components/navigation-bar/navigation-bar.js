Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    subtitle: {
      type: String,
      value: ''
    },
    theme: {
      type: String,
      value: 'default'
    }
  },
  data: {
    themeClassMap: {
      default: 'nav-default',
      emerald: 'nav-emerald',
      sky: 'nav-sky'
    }
  },
  methods: {}
});
