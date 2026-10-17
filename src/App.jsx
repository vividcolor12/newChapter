import { useEffect, useRef, useState } from 'react';
import Main from './origin/Main.jsx';
import Intro from './origin/Intro.jsx';
import Gallery from './origin/Gallery.jsx';
import Account from './origin/Account.jsx';
import EndingV2Area from './origin/EndingV2Area.jsx';
import GalleryViewer from './components/GalleryViewer.jsx';
import CopyAlert from './origin/popups/CopyAlert.jsx';
import Opening from './origin/Opening.jsx';
import { GALLERY, photo } from './data/photos.js';

const BGM = 'https://theirmood.com/src/bgm/romantic-memories.mp3';

const ARROW_DOWN = 'M10.2349 3.48486C10.3813 3.33841 10.6187 3.33841 10.7651 3.48486C10.9116 3.6313 10.9116 3.86869 10.7651 4.01513L6.26513 8.51513C6.11869 8.66157 5.8813 8.66157 5.73486 8.51513L1.23486 4.01513L1.20898 3.98656C1.08895 3.83928 1.0976 3.62211 1.23486 3.48486C1.37211 3.3476 1.58928 3.33895 1.73656 3.45898L1.76513 3.48486L5.99999 7.71972L10.2349 3.48486Z';
const ARROW_UP = 'M5.7634 3.45897C5.91069 3.33895 6.12786 3.3476 6.26511 3.48485L10.7651 7.98485L10.791 8.01341C10.911 8.1607 10.9023 8.37787 10.7651 8.51512C10.6279 8.65237 10.4107 8.66101 10.2634 8.541L10.2348 8.51512L5.99997 4.28026L1.76511 8.51512C1.61867 8.66156 1.38128 8.66155 1.23483 8.51512C1.08839 8.36868 1.08839 8.1313 1.23483 7.98485L5.73484 3.48485L5.7634 3.45897Z';

const GALLERY_IMAGES = GALLERY.map(({ id }) => photo(id));

// data-aos 요소가 화면에 들어오면 aos-animate 클래스를 붙여 페이드인시킵니다.
function useAos(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('aos-animate');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    const seen = new WeakSet();
    const observe = (el) => {
      if (seen.has(el) || el.classList.contains('aos-animate')) return;
      seen.add(el);
      io.observe(el);
    };
    const scan = (node) => {
      if (node.nodeType !== 1) return;
      if (node.hasAttribute('data-aos')) observe(node);
      node.querySelectorAll('[data-aos]').forEach(observe);
    };
    scan(root);

    // 나중에 렌더링되거나 data-aos 가 나중에 붙는 요소(핫 리로드 등)도 관찰해야
    // opacity: 0 상태로 남지 않습니다.
    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === 'attributes') scan(m.target);
        else m.addedNodes.forEach(scan);
      });
    });
    mo.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-aos'],
    });
    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, [rootRef]);
}

export default function App() {
  const rootRef = useRef(null);
  const audioRef = useRef(null);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [opening, setOpening] = useState(true);
  const [playing, setPlaying] = useState(false);
  useAos(rootRef);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const finishOpening = () => {
    setOpening(false);
    audioRef.current?.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  useEffect(() => {
    if (!copyOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [copyOpen]);

  const handleClick = (e) => {
    const t = e.target;

    const item = t.closest('.gallGridWrapper .item');
    if (item) {
      setViewerIndex([...item.parentElement.children].indexOf(item));
      return;
    }

    // 계좌번호 아코디언
    const head = t.closest('#section-account .list-head');
    if (head) {
      const list = head.parentElement.querySelector('.item-list');
      const open = list.classList.toggle('on');
      head.querySelector('path').setAttribute('d', open ? ARROW_UP : ARROW_DOWN);
      return;
    }

    // 계좌번호 복사
    const copyBtn = t.closest('#section-account .holder, #section-account .account');
    if (copyBtn) {
      const li = copyBtn.closest('.item');
      const text = `${li.querySelector('.bnk').textContent} ${li.querySelector('.nmb').textContent}`;
      navigator.clipboard?.writeText(text).catch(() => {});
      setCopyOpen(true);
      return;
    }

    if (t.closest('.sound')) toggleAudio();
  };

  return (
    <div className="clone-shell" onClick={handleClick}>
      {opening ? <Opening onDone={finishOpening} /> : null}
      <audio ref={audioRef} src={BGM} loop />
      <div className="bgm-wrapper bg_theme_white">
        <div className="bgm-banner">
          <button type="button" className="sound" aria-label="배경음악">
            {['no-1', 'no-2', 'no-3', 'no-4'].map((name) => (
              <span key={name} className={playing ? name : `${name} paused`} />
            ))}
          </button>
        </div>
      </div>
      <div
        ref={rootRef}
        data-v-0f70ab0a=""
        data-v-0fac639e=""
        className={`container bg_theme_white theme_emp_color_purple ft-gowundodum bg_pattern_small_flower${viewerIndex !== null ? ' blur-active' : ''}`}
      >
        <Main />
        <Intro />
        <Gallery />
        <Account />
        <EndingV2Area />
      </div>

      {viewerIndex !== null ? (
        <GalleryViewer images={GALLERY_IMAGES} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      ) : null}

      {copyOpen ? (
        <div
          data-v-9742d2b2=""
          className="popup-stack bg_theme_white"
          onClick={(e) => {
            if (e.target.closest('.pop-alert button, .pop-alert .background')) setCopyOpen(false);
          }}
        >
          <CopyAlert />
        </div>
      ) : null}
    </div>
  );
}
