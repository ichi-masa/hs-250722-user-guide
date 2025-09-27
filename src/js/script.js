// Scroll Hint
document.addEventListener('DOMContentLoaded', function() {
  const scrollHint = new ScrollHint('.p-manual__table-wrap', {
    suggestiveShadow: true,
    i18n: {
      scrollable: 'scrollable'
    }
  });
});