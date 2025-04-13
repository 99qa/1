let player;
let isLoading = false;

// YouTube IFrame API の準備
function onYouTubeIframeAPIReady() {
  // プレーヤーの初期化は URL 入力後に行う
}

// DOM要素の取得
const urlForm = document.getElementById('urlForm');
const urlInput = document.getElementById('urlInput');
const loadBtn = document.getElementById('loadBtn');
const errorMessage = document.getElementById('errorMessage');
const playerContainer = document.getElementById('player');
const songTitle = document.getElementById('songTitle');
const channelTitle = document.getElementById('channelTitle');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const volumeBtn = document.getElementById('volumeBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeRange = volumeSlider.querySelector('input');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const shareBtn = document.getElementById('shareBtn');

// モーダル関連の要素
const modals = document.querySelectorAll('.modal');
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const donateBtn = document.getElementById('donateBtn');
const donateModal = document.getElementById('donateModal');
const termsBtn = document.getElementById('termsBtn');
const termsModal = document.getElementById('termsModal');
const closeBtns = document.querySelectorAll('.close-btn');
const themeBtn = document.getElementById('themeBtn');

// プレーヤーの状態
let playerState = {
  isPlaying: false,
  volume: 100,
  isLooping: false,
  isShuffled: false,
  isDarkMode: true
};

// URLからプレイリストIDを抽出
function extractPlaylistId(url) {
  try {
    const urlObj = new URL(url);
    const searchParams = new URLSearchParams(urlObj.search);
    return searchParams.get('list');
  } catch {
    const regex = /[?&]list=([^#\&\?]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
}

// YouTubeのURLを検証
function validateYouTubeUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com';
  } catch {
    return false;
  }
}

// プレーヤーの初期化
function initializePlayer(playlistId) {
  if (player) {
    player.destroy();
  }

  player = new YT.Player('youtubePlayer', {
    height: '100%',
    width: '100%',
    playerVars: {
      listType: 'playlist',
      list: playlistId,
      autoplay: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      cc_load_policy: 3,
      cc_lang_pref: 'ja'
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError
    }
  });
}

// プレーヤーの準備完了時
function onPlayerReady(event) {
  event.target.setVolume(playerState.volume);
  updatePlayPauseButton();
  playerContainer.classList.remove('hidden');
  isLoading = false;
  loadBtn.classList.remove('loading');
}

// プレーヤーの状態変更時
function onPlayerStateChange(event) {
  playerState.isPlaying = event.data === YT.PlayerState.PLAYING;
  updatePlayPauseButton();
  updateSongInfo();
}

// プレーヤーのエラー時
function onPlayerError(event) {
  console.error('Player error:', event.data);
  errorMessage.textContent = '動画の読み込みに失敗しました。別のプレイリストを試してください。';
  isLoading = false;
  loadBtn.classList.remove('loading');
}

// 再生/一時停止ボタンの更新
function updatePlayPauseButton() {
  playPauseBtn.innerHTML = playerState.isPlaying
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
}

// 曲情報の更新
function updateSongInfo() {
  if (player && player.getVideoData) {
    const videoData = player.getVideoData();
    if (videoData) {
      songTitle.textContent = videoData.title || '読み込み中...';
      channelTitle.textContent = videoData.author || 'チャンネル読み込み中...';
    }
  }
}

// フォームの送信処理
urlForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (isLoading) return;

  const url = urlInput.value.trim();
  errorMessage.textContent = '';

  if (!validateYouTubeUrl(url)) {
    errorMessage.textContent = 'YouTubeの有効なURLを入力してください';
    return;
  }

  const playlistId = extractPlaylistId(url);
  if (!playlistId) {
    errorMessage.textContent = 'プレイリストIDが見つかりませんでした';
    return;
  }

  isLoading = true;
  loadBtn.classList.add('loading');
  initializePlayer(playlistId);
});

// 再生コントロール
playPauseBtn.addEventListener('click', () => {
  if (!player) return;
  if (playerState.isPlaying) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
});

prevBtn.addEventListener('click', () => {
  if (player) {
    player.previousVideo();
  }
});

nextBtn.addEventListener('click', () => {
  if (player) {
    player.nextVideo();
  }
});

// 音量コントロール
volumeBtn.addEventListener('click', () => {
  volumeSlider.classList.toggle('hidden');
});

volumeBtn.addEventListener('mouseenter', () => {
  volumeSlider.classList.remove('hidden');
});

volumeSlider.addEventListener('mouseleave', () => {
  volumeSlider.classList.add('hidden');
});

volumeRange.addEventListener('input', (e) => {
  const newVolume = parseInt(e.target.value);
  if (player) {
    player.setVolume(newVolume);
    playerState.volume = newVolume;
    updateVolumeIcon();
  }
});

function updateVolumeIcon() {
  const volume = playerState.volume;
  let icon;
  if (volume === 0) {
    icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
  } else if (volume < 50) {
    icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
  } else {
    icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';
  }
  volumeBtn.innerHTML = icon;
}

// シャッフル・リピート
shuffleBtn.addEventListener('click', () => {
  if (!player) return;
  playerState.isShuffled = !playerState.isShuffled;
  player.setShuffle(playerState.isShuffled);
  shuffleBtn.classList.toggle('text-blue-500');
});

repeatBtn.addEventListener('click', () => {
  if (!player) return;
  playerState.isLooping = !playerState.isLooping;
  player.setLoop(playerState.isLooping);
  repeatBtn.classList.toggle('text-blue-500');
});

// 共有
shareBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    alert('URLをコピーしました！');
  } catch (err) {
    alert('URLのコピーに失敗しました');
  }
});

// モーダル制御
function openModal(modal) {
  modal.classList.remove('hidden');
}

function closeModal(modal) {
  modal.classList.add('hidden');
}

helpBtn.addEventListener('click', () => openModal(helpModal));
donateBtn.addEventListener('click', () => openModal(donateModal));
termsBtn.addEventListener('click', () => openModal(termsModal));

closeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const modal = btn.closest('.modal');
    closeModal(modal);
  });
});

modals.forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal);
    }
  });
});

// 寄付ボタン
document.querySelectorAll('.donate-tier-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const amount = btn.dataset.amount;
    window.open(`https://ko-fi.com/your-account?amount=${amount}`, '_blank');
  });
});

// テーマ切り替え
themeBtn.addEventListener('click', () => {
  playerState.isDarkMode = !playerState.isDarkMode;
  document.body.classList.toggle('light-theme');
  themeBtn.innerHTML = playerState.isDarkMode
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>';
});
