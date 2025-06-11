let player;
let isPlaying = false;
let volume = 100;
let isLooping = false;
let isShuffled = false;
let currentTime = 0;
let duration = 0;
let progressInterval;
let urlHistory = [];

// ローカルストレージから履歴を読み込み
function loadHistory() {
  const saved = localStorage.getItem('youtubePlaylistHistory');
  if (saved) {
    try {
      urlHistory = JSON.parse(saved);
    } catch (e) {
      urlHistory = [];
    }
  }
}

// 履歴をローカルストレージに保存
function saveHistory() {
  localStorage.setItem('youtubePlaylistHistory', JSON.stringify(urlHistory));
}

// 履歴にURLを追加
function addToHistory(url) {
  const existingIndex = urlHistory.findIndex(item => item.url === url);
  if (existingIndex !== -1) {
    urlHistory.splice(existingIndex, 1);
  }
  
  urlHistory.unshift({
    url: url,
    date: new Date().toLocaleString('ja-JP'),
    timestamp: Date.now()
  });
  
  // 最大20件まで保持
  if (urlHistory.length > 20) {
    urlHistory = urlHistory.slice(0, 20);
  }
  
  saveHistory();
  updateHistoryDisplay();
}

// 履歴から1つのアイテムを削除
function removeFromHistory(index) {
  urlHistory.splice(index, 1);
  saveHistory();
  updateHistoryDisplay();
  showNotification('履歴を削除しました', 'success');
}

// 履歴表示を更新
function updateHistoryDisplay() {
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';
  
  if (urlHistory.length === 0) {
    historyList.innerHTML = '<div class="history-item" style="text-align: center; opacity: 0.6;">履歴がありません</div>';
    return;
  }
  
  urlHistory.forEach((item, index) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <div class="history-content">
        <div class="history-url">${item.url}</div>
        <div class="history-date">${item.date}</div>
      </div>
      <button class="delete-history-item" data-index="${index}" title="削除">🗑️</button>
    `;
    
    // URLクリックで入力フィールドに設定
    historyItem.querySelector('.history-content').addEventListener('click', () => {
      document.getElementById('urlInput').value = item.url;
      hideHistoryDropdown();
    });
    
    // 削除ボタンのイベント
    historyItem.querySelector('.delete-history-item').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromHistory(index);
    });
    
    historyList.appendChild(historyItem);
  });
}

// 履歴ドロップダウンを表示
function showHistoryDropdown() {
  const dropdown = document.getElementById('historyDropdown');
  dropdown.classList.remove('hidden');
  updateHistoryDisplay();
}

// 履歴ドロップダウンを非表示
function hideHistoryDropdown() {
  const dropdown = document.getElementById('historyDropdown');
  dropdown.classList.add('hidden');
}

// 履歴をクリア
function clearHistory() {
  urlHistory = [];
  saveHistory();
  updateHistoryDisplay();
  showNotification('履歴をクリアしました', 'success');
}

// 時間をフォーマット
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// プログレスバーを更新
function updateProgress() {
  if (player && player.getCurrentTime && player.getDuration) {
    try {
      currentTime = player.getCurrentTime();
      duration = player.getDuration();
      
      if (duration > 0) {
        const progressPercent = (currentTime / duration) * 100;
        document.getElementById('progressFill').style.width = `${progressPercent}%`;
        document.getElementById('currentTime').textContent = formatTime(currentTime);
        document.getElementById('duration').textContent = formatTime(duration);
      }
    } catch (err) {
      // プレーヤーがまだ準備できていない場合は無視
    }
  }
}

// YouTube IFrame API の準備
function onYouTubeIframeAPIReady() {
  // プレーヤーは後で初期化されます
}

// URLから動画ID、プレイリストID、チャンネルIDを抽出
function extractYouTubeIds(url) {
  try {
    const urlObj = new URL(url);
    const searchParams = new URLSearchParams(urlObj.search);
    
    // プレイリストID
    const playlistId = searchParams.get('list');
    if (playlistId) {
      return { type: 'playlist', id: playlistId };
    }
    
    // 動画ID
    let videoId = searchParams.get('v');
    if (!videoId && urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
    }
    if (videoId) {
      return { type: 'video', id: videoId };
    }
    
    // チャンネルID
    const channelMatch = urlObj.pathname.match(/\/(channel|c|user)\/([^\/]+)/);
    if (channelMatch) {
      return { type: 'channel', id: channelMatch[2] };
    }
    
    return null;
  } catch {
    // 正規表現でのフォールバック
    const playlistMatch = url.match(/[?&]list=([^#\&\?]+)/);
    if (playlistMatch) {
      return { type: 'playlist', id: playlistMatch[1] };
    }
    
    const videoMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^#\&\?]+)/);
    if (videoMatch) {
      return { type: 'video', id: videoMatch[1] };
    }
    
    return null;
  }
}

// YouTubeのURLを検証
function validateYouTubeUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com' || urlObj.hostname === 'youtu.be';
  } catch {
    return false;
  }
}

// プレーヤーの初期化
function initializePlayer(youtubeData) {
  if (player) {
    player.destroy();
  }
  
  let playerVars = {
    autoplay: 1,
    controls: 0,
    modestbranding: 1,
    rel: 0,
    showinfo: 0,
    iv_load_policy: 3,
    cc_load_policy: 0,
    disablekb: 1,
    fs: 1,
    playsinline: 1
  };
  
  // タイプに応じてパラメータを設定
  if (youtubeData.type === 'playlist') {
    playerVars.listType = 'playlist';
    playerVars.list = youtubeData.id;
  } else if (youtubeData.type === 'video') {
    playerVars.videoId = youtubeData.id;
  } else if (youtubeData.type === 'channel') {
    playerVars.listType = 'user_uploads';
    playerVars.list = youtubeData.id;
  }
  
  player = new YT.Player('player', {
    height: '100%',
    width: '100%',
    playerVars: playerVars,
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError
    }
  });
}

// プレーヤーの準備完了時
function onPlayerReady(event) {
  event.target.setVolume(volume);
  if (isLooping) {
    event.target.setLoop(true);
  }
  if (isShuffled) {
    event.target.setShuffle(true);
  }
  updateSongInfo();
  
  // プログレス更新を開始
  progressInterval = setInterval(updateProgress, 1000);
}

// プレーヤーの状態変更時
function onPlayerStateChange(event) {
  isPlaying = event.data === YT.PlayerState.PLAYING;
  updatePlayPauseButton();
  updateSongInfo();
  
  if (isPlaying) {
    if (!progressInterval) {
      progressInterval = setInterval(updateProgress, 1000);
    }
  } else {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }
}

// エラー発生時
function onPlayerError(event) {
  let message = '動画の読み込みに失敗しました。';
  
  switch (event.data) {
    case 2:
      message = '無効なパラメータです。URLを確認してください。';
      break;
    case 5:
      message = 'HTML5プレーヤーでエラーが発生しました。';
      break;
    case 100:
      message = '動画が見つかりません。';
      break;
    case 101:
    case 150:
      message = '動画の所有者が埋め込みを許可していません。';
      break;
  }
  
  showNotification(message, 'error');
}

// 再生/一時停止ボタンの更新
function updatePlayPauseButton() {
  const button = document.getElementById('playPauseButton');
  button.className = `control-button ${isPlaying ? 'pause-icon' : 'play-icon'}`;
}

// 曲情報の更新
function updateSongInfo() {
  if (player && player.getVideoData) {
    try {
      const data = player.getVideoData();
      if (data && data.title && data.author) {
        document.getElementById('songTitle').textContent = data.title;
        document.getElementById('channelTitle').textContent = data.author;
      }
    } catch (err) {
      console.error('動画データの取得に失敗:', err);
    }
  }
}

// 通知を表示
function showNotification(message, type = 'info') {
  // 既存の通知を削除
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => notification.remove());
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  // アニメーション用のクラスを追加
  setTimeout(() => notification.classList.add('show'), 100);

  // 3秒後に通知を削除
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 3000);
}

// フルスクリーン切り替え
function toggleFullscreen() {
  const playerContainer = document.getElementById('player-container');
  
  if (!document.fullscreenElement) {
    playerContainer.requestFullscreen().then(() => {
      showNotification('フルスクリーンモード');
    }).catch(() => {
      showNotification('フルスクリーンに失敗しました', 'error');
    });
  } else {
    document.exitFullscreen().then(() => {
      showNotification('フルスクリーン終了');
    });
  }
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  
  const urlForm = document.getElementById('urlForm');
  const urlInput = document.getElementById('urlInput');
  const playerContainer = document.getElementById('player-container');
  const volumeButton = document.getElementById('volumeButton');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeInput = volumeSlider.querySelector('input');
  const volumeDisplay = document.getElementById('volumeDisplay');
  const termsButton = document.getElementById('termsButton');
  const termsModal = document.getElementById('termsModal');
  const guideButton = document.getElementById('guideButton');
  const guideModal = document.getElementById('guideModal');
  const historyDropdown = document.getElementById('historyDropdown');
  const clearHistoryButton = document.getElementById('clearHistory');
  const progressBar = document.querySelector('.progress-bar');

  // URLフォームの送信
  urlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    
    if (!url) {
      showNotification('URLを入力してください', 'error');
      return;
    }
    
    if (!validateYouTubeUrl(url)) {
      showNotification('YouTubeの有効なURLを入力してください', 'error');
      return;
    }

    const youtubeData = extractYouTubeIds(url);
    if (!youtubeData) {
      showNotification('有効なYouTube URLが見つかりませんでした', 'error');
      return;
    }

    playerContainer.classList.remove('hidden');
    initializePlayer(youtubeData);
    addToHistory(url);
    hideHistoryDropdown();
    
    const typeText = youtubeData.type === 'playlist' ? 'プレイリスト' : 
                    youtubeData.type === 'video' ? '動画' : 'チャンネル';
    showNotification(`${typeText}を読み込みました！`, 'success');
  });

  // 入力フィールドのフォーカス時に履歴を表示
  urlInput.addEventListener('focus', () => {
    if (urlHistory.length > 0) {
      showHistoryDropdown();
    }
  });

  // 入力フィールドの入力時
  urlInput.addEventListener('input', (e) => {
    if (e.target.value.trim() === '' && urlHistory.length > 0) {
      showHistoryDropdown();
    } else {
      hideHistoryDropdown();
    }
  });

  // 履歴クリアボタン
  clearHistoryButton.addEventListener('click', clearHistory);

  // プログレスバークリック
  progressBar.addEventListener('click', (e) => {
    if (player && duration > 0) {
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const seekTime = duration * percentage;
      player.seekTo(seekTime);
      showNotification(`${formatTime(seekTime)}にシーク`);
    }
  });

  // 再生/一時停止
  document.getElementById('playPauseButton').addEventListener('click', () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
        showNotification('一時停止');
      } else {
        player.playVideo();
        showNotification('再生');
      }
    }
  });

  // 前の曲
  document.getElementById('prevButton').addEventListener('click', () => {
    if (player) {
      player.previousVideo();
      showNotification('前の曲を再生中');
    }
  });

  // 次の曲
  document.getElementById('nextButton').addEventListener('click', () => {
    if (player) {
      player.nextVideo();
      showNotification('次の曲を再生中');
    }
  });

  // 音量コントロール
  volumeButton.addEventListener('click', () => {
    volumeSlider.classList.toggle('hidden');
  });

  volumeInput.addEventListener('input', (e) => {
    volume = parseInt(e.target.value);
    if (player) {
      player.setVolume(volume);
    }
    volumeDisplay.textContent = `${volume}%`;
    
    // 音量アイコンを更新
    if (volume === 0) {
      volumeButton.className = 'control-button volume-muted-icon';
    } else {
      volumeButton.className = 'control-button volume-icon';
    }
    
    showNotification(`音量: ${volume}%`);
  });

  // シャッフル
  document.getElementById('shuffleButton').addEventListener('click', () => {
    if (player) {
      isShuffled = !isShuffled;
      player.setShuffle(isShuffled);
      const button = document.getElementById('shuffleButton');
      button.classList.toggle('active', isShuffled);
      showNotification(isShuffled ? 'シャッフル: オン' : 'シャッフル: オフ');
    }
  });

  // リピート
  document.getElementById('loopButton').addEventListener('click', () => {
    if (player) {
      isLooping = !isLooping;
      player.setLoop(isLooping);
      const button = document.getElementById('loopButton');
      button.classList.toggle('active', isLooping);
      showNotification(isLooping ? 'リピート: オン' : 'リピート: オフ');
    }
  });

  // 共有
  document.getElementById('shareButton').addEventListener('click', async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'ソニックウェーブ - YouTube Music Player',
          text: '素晴らしい音楽プレーヤーを見つけました！',
          url: window.location.href
        });
        showNotification('共有しました！', 'success');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showNotification('URLをコピーしました！', 'success');
      }
    } catch (err) {
      showNotification('共有に失敗しました', 'error');
    }
  });

  // フルスクリーン
  document.getElementById('fullscreenButton').addEventListener('click', toggleFullscreen);

  // 利用規約モーダル
  termsButton.addEventListener('click', () => {
    termsModal.classList.remove('hidden');
  });

  // 使い方ガイドモーダル
  guideButton.addEventListener('click', () => {
    guideModal.classList.remove('hidden');
  });

  // モーダルを閉じる
  document.querySelectorAll('.close-button').forEach(button => {
    button.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      modal.classList.add('hidden');
    });
  });

  // モーダルの外側をクリックして閉じる
  [termsModal, guideModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // 音量スライダーを非表示にする
  document.addEventListener('click', (e) => {
    if (!volumeSlider.contains(e.target) && !volumeButton.contains(e.target)) {
      volumeSlider.classList.add('hidden');
    }
    
    // 履歴ドロップダウンを非表示にする
    if (!historyDropdown.contains(e.target) && !urlInput.contains(e.target)) {
      hideHistoryDropdown();
    }
  });

  // キーボードショートカット
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        document.getElementById('playPauseButton').click();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        document.getElementById('prevButton').click();
        break;
      case 'ArrowRight':
        e.preventDefault();
        document.getElementById('nextButton').click();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (volume < 100) {
          volumeInput.value = Math.min(100, volume + 10);
          volumeInput.dispatchEvent(new Event('input'));
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (volume > 0) {
          volumeInput.value = Math.max(0, volume - 10);
          volumeInput.dispatchEvent(new Event('input'));
        }
        break;
      case 'KeyS':
        e.preventDefault();
        document.getElementById('shuffleButton').click();
        break;
      case 'KeyL':
        e.preventDefault();
        document.getElementById('loopButton').click();
        break;
      case 'KeyF':
        e.preventDefault();
        toggleFullscreen();
        break;
    }
  });

  // フルスクリーン変更イベント
  document.addEventListener('fullscreenchange', () => {
    const button = document.getElementById('fullscreenButton');
    if (document.fullscreenElement) {
      button.style.color = '#4fc3f7';
    } else {
      button.style.color = '';
    }
  });

  // スタイルシートに通知用のスタイルを追加
  const style = document.createElement('style');
  style.textContent = `
    .notification {
      position: fixed;
      top: 2rem;
      left: 50%;
      transform: translateX(-50%) translateY(-3rem);
      background: linear-gradient(135deg, rgba(30, 60, 114, 0.95), rgba(42, 82, 152, 0.95));
      backdrop-filter: blur(20px);
      color: white;
      padding: 1rem 2rem;
      border-radius: 25px;
      z-index: 2000;
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      font-weight: 600;
      font-size: 0.95rem;
      max-width: 90vw;
      text-align: center;
    }
    
    .notification.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    
    .notification.success {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(16, 185, 129, 0.95));
    }
    
    .notification.error {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95));
    }
    
    @media (max-width: 480px) {
      .notification {
        padding: 0.75rem 1.5rem;
        font-size: 0.9rem;
        border-radius: 20px;
      }
    }
  `;
  document.head.appendChild(style);
});

// ページ離脱時にプログレス更新を停止
window.addEventListener('beforeunload', () => {
  if (progressInterval) {
    clearInterval(progressInterval);
  }
});
