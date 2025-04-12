// Modal content data
const modalContent = {
  terms: {
    title: '利用規約',
    content: `
1. 利用規約について
本規約は、当サイトが提供するツールの利用に関する条件を定めるものです。

2. 免責事項
当サイトで提供されるツールの使用により生じた損害について、当サイトは一切の責任を負いません。

3. 著作権
当サイトで提供されるツールの著作権は、各ツールの開発者に帰属します。

4. 利用制限
営利目的での再配布は禁止されています。
    `
  },
  donation: {
    title: '寄付について',
    content: `
プロジェクトをサポートしていただき、ありがとうございます。

寄付は以下の方法で受け付けております：

• クレジットカード
• PayPal
• 暗号通貨

寄付していただいた資金は、以下の用途に使用されます：
• 新機能の開発
• サーバー維持費
• ツールの改善
    `
  }
};

// Modal functionality
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalContentElement = document.getElementById('modal-content');

function showModal(type) {
  const content = modalContent[type];
  modalTitle.textContent = content.title;
  modalContentElement.textContent = content.content;
  modal.classList.add('active');
}

function closeModal() {
  modal.classList.remove('active');
}

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('active')) {
    closeModal();
  }
});
