/**
 * ページ内キーワードハイライト＆スクロール機能
 */
class PageHighlighter {
  constructor() {
    this.init();
  }

  init() {
    // URLパラメータから検索キーワードを取得
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    
    if (searchQuery) {
      // ページが完全に読み込まれてからハイライト実行
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.highlightAndScroll(searchQuery));
      } else {
        this.highlightAndScroll(searchQuery);
      }
    }
  }

  /**
   * キーワードをハイライトしてスクロール
   */
  highlightAndScroll(query) {
    const keywords = query.toLowerCase().split(/\s+/);
    let firstMatch = null;

    // メインコンテンツエリアを対象にする
    const contentArea = document.querySelector('.p-main__content') || document.body;
    
    // テキストノードを検索してハイライト
    this.highlightInElement(contentArea, keywords, (element) => {
      if (!firstMatch) {
        firstMatch = element;
      }
    });

    // 最初にマッチした要素にスクロール
    if (firstMatch) {
      setTimeout(() => {
        firstMatch.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }

  /**
   * 要素内のテキストをハイライト
   */
  highlightInElement(element, keywords, onFirstMatch) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // スクリプトタグやスタイルタグ内は除外
          const parent = node.parentElement;
          if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      let highlightedText = text;
      let hasMatch = false;

      keywords.forEach(keyword => {
        const regex = new RegExp(`(${this.escapeRegex(keyword)})`, 'gi');
        if (regex.test(highlightedText)) {
          highlightedText = highlightedText.replace(regex, '<mark class="search-highlight">$1</mark>');
          hasMatch = true;
        }
      });

      if (hasMatch) {
        const wrapper = document.createElement('span');
        wrapper.innerHTML = highlightedText;
        textNode.parentNode.replaceChild(wrapper, textNode);
        
        // 最初のマッチを記録
        const firstHighlight = wrapper.querySelector('.search-highlight');
        if (firstHighlight) {
          onFirstMatch(firstHighlight);
        }
      }
    });
  }

  /**
   * 正規表現用にエスケープ
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
  new PageHighlighter();
});
