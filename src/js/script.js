// 言語切り替え機能
(function() {
  function getCurrentPage() {
    const path = window.location.pathname;
    const fileName = path.split('/').pop() || 'index.html';
    return fileName;
  }

  function getCurrentLanguageCode() {
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(part => part);
    return pathParts[0] || 'en-GB';
  }

  function initLanguageSwitcher() {
    const currentPage = getCurrentPage();
    const currentLangCode = getCurrentLanguageCode();

    fetch('./assets/data/languages.json')
      .then(response => response.json())
      .then(data => {
        const languages = data.languages;

        if (languages.length === 0) {
          return;
        }

        const currentLang = languages.find(lang => lang.code === currentLangCode);
        const displayLang = currentLang || languages.find(lang => lang.default === true) || languages[0];

        const currentLangElement = document.querySelector('.js-current-language');
        if (currentLangElement) {
          currentLangElement.textContent = displayLang.name;
        }

        const languageList = document.getElementById('languageDropdown');
        if (languageList) {
          languageList.innerHTML = '';

          languages.forEach(lang => {
            const li = document.createElement('li');
            li.className = 'p-control__language-item';

            const a = document.createElement('a');
            a.href = `/${lang.code}/${currentPage}`;
            a.className = 'p-control__language-link';
            a.textContent = lang.name;

            li.appendChild(a);
            languageList.appendChild(li);
          });
        }
      })
      .catch(error => {
        console.error('言語ファイルの読み込みに失敗しました:', error);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageSwitcher);
  } else {
    initLanguageSwitcher();
  }
})();

// Scroll Hint
document.addEventListener('DOMContentLoaded', function() {
  const scrollHint = new ScrollHint('.p-manual__table-wrap', {
    suggestiveShadow: true,
    i18n: {
      scrollable: 'scrollable'
    }
  });
});