/**
 * 検索機能
 */
class SearchManager {
  constructor() {
    this.searchData = [];
    this.searchInput = null;
    this.searchResults = null;
    this.noResults = null;
    this.isSearchPage = false;
    
    this.init();
  }

  /**
   * 初期化
   */
  async init() {
    this.searchInput = document.querySelector('.p-control__search-input');
    this.searchResults = document.querySelector('.p-search__results');
    this.noResults = document.querySelector('.p-search__no-results');
    
    // 検索ページかどうかを判定
    this.isSearchPage = window.location.pathname.includes('search.html');
    
    // 検索データを読み込み
    await this.loadSearchData();
    
    // イベントリスナーを設定
    this.setupEventListeners();
    
    // URLパラメータから検索クエリを取得して検索実行
    this.handleUrlParams();
  }

  /**
   * 検索データを読み込み
   */
  async loadSearchData() {
    try {
      // URLパスから言語コードを取得
      // 例: /en-GB/index.html → en-GB
      // 例: file:///path/to/dist/en-GB/index.html → en-GB
      const pathParts = window.location.pathname.split('/').filter(p => p);

      // 言語コードっぽいもの（xx-XX形式）を探す
      const lang = pathParts.find(part => /^[a-z]{2}-[A-Z]{2}$/.test(part)) || 'en-GB';

      const response = await fetch(`./assets/data/searchdata-${lang}.json`);
      this.searchData = await response.json();
    } catch (error) {
      console.error('検索データの読み込みに失敗しました:', error);
      this.searchData = [];
    }
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    if (this.searchInput) {
      // Enterキーで検索実行
      this.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch();
        }
      });

      // リアルタイム検索（検索ページのみ）
      if (this.isSearchPage) {
        this.searchInput.addEventListener('input', this.debounce(() => {
          this.performSearch();
        }, 300));
      }
    }
  }

  /**
   * URLパラメータから検索クエリを取得
   */
  handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    if (query && this.searchInput) {
      this.searchInput.value = query;
      if (this.isSearchPage) {
        this.performSearch();
      }
    }
  }

  /**
   * 検索実行
   */
  performSearch() {
    const query = this.searchInput.value.trim();
    
    if (!query) {
      if (this.isSearchPage) {
        this.displayResults([]);
      }
      return;
    }

    if (this.isSearchPage) {
      // 検索ページの場合はその場で結果を表示
      const results = this.search(query);
      this.displayResults(results, query);
      
      // URLを更新
      const url = new URL(window.location);
      url.searchParams.set('q', query);
      window.history.replaceState(null, '', url);
    } else {
      // 他のページの場合は検索ページに遷移
      window.location.href = `./search.html?q=${encodeURIComponent(query)}`;
    }
  }

  /**
   * 検索実行
   */
  search(query) {
    const keywords = query.toLowerCase().split(/\s+/);
    const results = [];

    this.searchData.forEach(item => {
      let score = 0;
      const searchText = `${item.title} ${item.description} ${item.content}`.toLowerCase();

      keywords.forEach(keyword => {
        const titleMatches = (item.title.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
        const descMatches = (item.description.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
        const contentMatches = (item.content.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;

        // タイトルマッチは高得点
        score += titleMatches * 10;
        // 説明マッチは中得点
        score += descMatches * 5;
        // コンテンツマッチは低得点
        score += contentMatches * 1;
      });

      if (score > 0) {
        // コンテンツから関連する部分を抜き出し
        const contentSnippet = this.extractSnippet(item.content, keywords);
        
        results.push({
          ...item,
          score: score,
          highlightedTitle: this.highlightText(item.title, keywords),
          highlightedDescription: this.highlightText(item.description, keywords),
          highlightedSnippet: contentSnippet ? this.highlightText(contentSnippet, keywords) : ''
        });
      }
    });

    // スコア順でソート
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * コンテンツから関連する部分を抜き出し
   */
  extractSnippet(content, keywords) {
    if (!content) return '';
    
    const words = content.split(/\s+/);
    const maxSnippetLength = 100; // 最大文字数
    
    // キーワードが含まれる位置を探す
    let bestStart = 0;
    let maxMatches = 0;
    
    for (let i = 0; i <= words.length - 10; i++) {
      const snippet = words.slice(i, i + 20).join(' ');
      let matches = 0;
      
      keywords.forEach(keyword => {
        if (snippet.toLowerCase().includes(keyword.toLowerCase())) {
          matches++;
        }
      });
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestStart = i;
      }
    }
    
    if (maxMatches === 0) {
      return words.slice(0, 15).join(' ') + (words.length > 15 ? '...' : '');
    }
    
    const snippetWords = words.slice(bestStart, bestStart + 20);
    let snippet = snippetWords.join(' ');
    
    if (snippet.length > maxSnippetLength) {
      snippet = snippet.substring(0, maxSnippetLength) + '...';
    }
    
    if (bestStart > 0) snippet = '...' + snippet;
    if (bestStart + 20 < words.length) snippet = snippet + '...';
    
    return snippet;
  }

  /**
   * テキストをハイライト
   */
  highlightText(text, keywords) {
    let highlighted = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });
    return highlighted;
  }

  /**
   * 検索結果を表示
   */
  displayResults(results, query = '') {
    if (!this.searchResults) return;

    if (results.length === 0) {
      this.searchResults.innerHTML = '';
      if (this.noResults) {
        this.noResults.style.display = 'block';
        if (query) {
          this.noResults.innerHTML = `
            <div class="p-search__no-results-content">
              <p class="p-search__no-results-text">No results found for "<strong>${this.escapeHtml(query)}</strong>"</p>
              <p class="p-search__no-results-suggestion">Try using different keywords or check your spelling.</p>
            </div>
          `;
        }
      }
      return;
    }

    if (this.noResults) {
      this.noResults.style.display = 'none';
    }

    const resultsHtml = results.map(result => {
      const linkUrl = query ? `${result.url}?q=${encodeURIComponent(query)}` : result.url;
      return `
        <div class="p-search__result-item">
          <h3 class="p-search__result-title">
            <a href="${linkUrl}" class="p-search__result-link">${result.highlightedTitle}</a>
          </h3>
          <p class="p-search__result-description">${result.highlightedDescription}</p>
          ${result.highlightedSnippet ? `<p class="p-search__result-snippet">${result.highlightedSnippet}</p>` : ''}
          <span class="p-search__result-url">${result.url}</span>
        </div>
      `;
    }).join('');

    this.searchResults.innerHTML = `
      <div class="p-search__results-header">
        <p class="p-search__results-count">${results.length} results found${query ? ` for "<strong>${this.escapeHtml(query)}</strong>"` : ''}</p>
      </div>
      <div class="p-search__results-list">
        ${resultsHtml}
      </div>
    `;
  }

  /**
   * HTMLエスケープ
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * デバウンス処理
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// DOM読み込み完了後に検索機能を初期化
document.addEventListener('DOMContentLoaded', () => {
  new SearchManager();
});
