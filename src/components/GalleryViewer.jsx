import { useEffect, useRef, useState } from 'react';
import './GalleryViewer.css';

const SWIPE_THRESHOLD = 50;

const mod = (n, m) => ((n % m) + m) % m;

export default function GalleryViewer({ images, initialIndex, onClose }) {
  const total = images.length;
  const [index, setIndex] = useState(initialIndex);
  const [shift, setShift] = useState(0);
  const [drag, setDrag] = useState(0);
  const [animating, setAnimating] = useState(false);
  const touchStartX = useRef(null);

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7745/ingest/da6d8c34-7722-40f6-b626-687107da8c65',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8edb7f'},body:JSON.stringify({sessionId:'8edb7f',runId:'post-fix',hypothesisId:'B',location:'GalleryViewer.jsx:index',message:'viewer slide',data:{initialIndex,index,count:`${index + 1}/${total}`,src:images[index]},timestamp:Date.now()})}).catch(()=>{});
  }, [index, initialIndex, total, images]);
  // #endregion

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const go = (dir) => {
    if (animating) return;
    setAnimating(true);
    setDrag(0);
    setShift(dir);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleTransitionEnd = () => {
    if (shift !== 0) setIndex((i) => mod(i + shift, total));
    setShift(0);
    setAnimating(false);
  };

  const onTouchStart = (e) => {
    if (animating) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e) => {
    if (touchStartX.current === null) return;
    setDrag(e.touches[0].clientX - touchStartX.current);
  };

  const onTouchEnd = () => {
    if (touchStartX.current === null) return;
    touchStartX.current = null;
    if (Math.abs(drag) > SWIPE_THRESHOLD) {
      go(drag < 0 ? 1 : -1);
    } else if (drag !== 0) {
      setAnimating(true);
      setDrag(0);
    }
  };

  const slides = [-1, 0, 1].map((o) => mod(index + o, total));

  return (
    <div className="popup-stack bg_theme_white">
      <section className="gallery-viewer">
        <div className="inner">
          <div className="head">
            <button type="button" className="close" onClick={onClose} aria-label="닫기">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4.21967 4.21991C4.51256 3.92702 4.98744 3.92702 5.28033 4.21991L12 10.9396L18.7197 4.21991C19.0126 3.92702 19.4874 3.92702 19.7803 4.21991C20.0732 4.51281 20.0732 4.98768 19.7803 5.28057L13.0607 12.0002L19.7803 18.7199C20.0732 19.0128 20.0732 19.4877 19.7803 19.7806C19.4874 20.0735 19.0126 20.0735 18.7197 19.7806L12 13.0609L5.28033 19.7806C4.98744 20.0735 4.51256 20.0735 4.21967 19.7806C3.92678 19.4877 3.92678 19.0128 4.21967 18.7199L10.9393 12.0002L4.21967 5.28057C3.92678 4.98768 3.92678 4.51281 4.21967 4.21991Z"
                  fill="#1a1a1a"
                />
              </svg>
            </button>
          </div>
          <div className="image-container">
            <div
              className="swiper"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div
                className="swiper-wrapper"
                style={{
                  transform: `translate3d(calc(${-(1 + shift) * 100}% + ${drag}px), 0, 0)`,
                  transition: animating ? 'transform 300ms ease' : 'none',
                }}
                onTransitionEnd={handleTransitionEnd}
              >
                {slides.map((imgIndex, pos) => (
                  <div className="swiper-slide" key={`${pos}-${imgIndex}`}>
                    <div className="swiper-zoom-container">
                      <img src={images[imgIndex]} alt="" draggable="false" />
                      <div className="image-guard" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="func-wrap">
            <div className="swiper-button-prev" onClick={() => go(-1)} role="button" aria-label="이전 사진">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14.5303 5.46967C14.8232 5.76256 14.8232 6.23744 14.5303 6.53033L9.06066 12L14.5303 17.4697C14.8232 17.7626 14.8232 18.2374 14.5303 18.5303C14.2374 18.8232 13.7626 18.8232 13.4697 18.5303L7.46967 12.5303C7.17678 12.2374 7.17678 11.7626 7.46967 11.4697L13.4697 5.46967C13.7626 5.17678 14.2374 5.17678 14.5303 5.46967Z"
                  fill="#1a1a1a"
                />
              </svg>
            </div>
            <div className="count">
              <span>{index + 1}</span>
              <span>/</span>
              <span>{total}</span>
            </div>
            <div className="swiper-button-next" onClick={() => go(1)} role="button" aria-label="다음 사진">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8.46967 5.46967C8.76256 5.17678 9.23744 5.17678 9.53033 5.46967L15.5303 11.4697C15.8232 11.7626 15.8232 12.2374 15.5303 12.5303L9.53033 18.5303C9.23744 18.8232 8.76256 18.8232 8.46967 18.5303C8.17678 18.2374 8.17678 17.7626 8.46967 17.4697L13.9393 12L8.46967 6.53033C8.17678 6.23744 8.17678 5.76256 8.46967 5.46967Z"
                  fill="#1a1a1a"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
