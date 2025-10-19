Component({
  properties: {
    tabs: {
      type: Array,
      value: []
    },
    active: {
      type: String,
      value: ''
    }
  },
  methods: {
    onTabTap(event) {
      const { key } = event.currentTarget.dataset;
      this.triggerEvent('change', { key });
    }
  }
});
