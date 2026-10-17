import { useEffect, useRef, useState } from 'react';
import './GalleryViewer.css';

const SWIPE_THRESHOLD = 48;

const mod = (n, m) => ((n % m) + m) % m;

export default function GalleryViewer({ images, initialIndex, onClose }) {
  const total = images.length;
  const [index, setIndex] = useState(initialIndex);
  const [shift, setShift] = useState(0);
  const [drag, setDrag] = useState(0);
  const [animating, setAnimating] = useState(false);
  const swiperRef = useRef(null);
  const shiftRef = useRef(0);
  const animatingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const totalRef = useRef(total);
  onCloseRef.current = onClose;
  totalRef.current = total;

  const settle = () => {
    if (!animatingRef.current) return;
    const dir = shiftRef.current;
    shiftRef.current = 0;
    animatingRef.current = false;
    if (dir !== 0) setIndex((i) => mod(i + dir, totalRef.current));
    setShift(0);
    setDrag(0);
    setAnimating(false);
  };

  const commitShift = (dir) => {
    if (animatingRef.current || dir === 0) return;
    animatingRef.current = true;
    shiftRef.current = dir;
    setAnimating(true);
    setDrag(0);
    setShift(dir);
  };

  const commitShiftRef = useRef(commitShift);
  commitShiftRef.current = commitShift;
  const settleRef = useRef(settle);
  settleRef.current = settle;

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const el = swiperRef.current;
    if (!el) return undefined;

    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let deltaX = 0;
    let axis = null;

    const endGesture = (e) => {
      if (pointerId === null || e.pointerId !== pointerId) return;
      try { if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId); } catch { /* already released */ }
      pointerId = null;
      const moved = deltaX;
      deltaX = 0;
      axis = null;
      if (Math.abs(moved) > SWIPE_THRESHOLD) {
        commitShiftRef.current(moved < 0 ? 1 : -1);
      } else if (moved !== 0) {
        animatingRef.current = true;
        shiftRef.current = 0;
        setAnimating(true);
        setDrag(0);
      }
    };

    const onDown = (e) => {
      if (animatingRef.current) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      deltaX = 0;
      axis = null;
      try { el.setPointerCapture(e.pointerId); } catch { /* pointer may already be gone */ }
    };

    const onMove = (e) => {
      if (pointerId === null || e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!axis) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
        if (axis === 'y') {
          try { if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId); } catch { /* already released */ }
          pointerId = null;
          return;
        }
      }
      if (axis !== 'x') return;
      e.preventDefault();
      deltaX = dx;
      setDrag(dx);
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', endGesture);
    el.addEventListener('pointercancel', endGesture);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', endGesture);
      el.removeEventListener('pointercancel', endGesture);
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
      if (e.key === 'ArrowLeft') commitShiftRef.current(-1);
      if (e.key === 'ArrowRight') commitShiftRef.current(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!animating) return undefined;
    const timer = setTimeout(() => settleRef.current(), 360);
    return () => clearTimeout(timer);
  }, [animating, shift, drag]);

  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return;
    settleRef.current();
  };

  const slides = [-1, 0, 1].map((offset) => mod(index + offset, total));

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
            <div className="swiper" ref={swiperRef}>
              <div
                className="swiper-wrapper"
                style={{
                  transform: `translate3d(calc(${-(1 + shift) * 100}% + ${drag}px), 0, 0)`,
                  transition: animating ? 'transform 300ms ease' : 'none',
                }}
                onTransitionEnd={handleTransitionEnd}
              >
                {slides.map((imgIndex) => (
                  <div className="swiper-slide" key={imgIndex}>
                    <div className="swiper-zoom-container">
                      <img src={images[imgIndex]} alt="" draggable="false" />
                      <div className="image-guard" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button type="button" className="nav-btn prev" onClick={() => commitShift(-1)} aria-label="이전 사진">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14.5303 5.46967C14.8232 5.76256 14.8232 6.23744 14.5303 6.53033L9.06066 12L14.5303 17.4697C14.8232 17.7626 14.8232 18.2374 14.5303 18.5303C14.2374 18.8232 13.7626 18.8232 13.4697 18.5303L7.46967 12.5303C7.17678 12.2374 7.17678 11.7626 7.46967 11.4697L13.4697 5.46967C13.7626 5.17678 14.2374 5.17678 14.5303 5.46967Z"
                  fill="#1a1a1a"
                />
              </svg>
            </button>
            <button type="button" className="nav-btn next" onClick={() => commitShift(1)} aria-label="다음 사진">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8.46967 5.46967C8.76256 5.17678 9.23744 5.17678 9.53033 5.46967L15.5303 11.4697C15.8232 11.7626 15.8232 12.2374 15.5303 12.5303L9.53033 18.5303C9.23744 18.8232 8.76256 18.8232 8.46967 18.5303C8.17678 18.2374 8.17678 17.7626 8.46967 17.4697L13.9393 12L8.46967 6.53033C8.17678 6.23744 8.17678 5.76256 8.46967 5.46967Z"
                  fill="#1a1a1a"
                />
              </svg>
            </button>
          </div>
          <div className="func-wrap">
            <div className="count">
              <span>{index + 1}</span>
              <span>/</span>
              <span>{total}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
