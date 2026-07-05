import { useRef, useState } from "react";
import type React from "react";

// Touch gesture hook for overlay touch-to-close
export function useTouchToClose(onClose: () => void) {
  const handleTouchStart = (_e: React.TouchEvent) => {
    onClose();
  };
  return { handleTouchStart };
}

// Swipe gesture hook for going back (left edge to right swipe)
export function useBackSwipe(canGoBack: boolean, onGoBack: () => void) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const currentX = useRef<number | null>(null);
  const EDGE_MARGIN = 0.05; // 5% from left edge
  const SWIPE_THRESHOLD = 0.20; // 20% of screen width
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!canGoBack) return;
    const touch = e.touches[0];
    const screenWidth = window.innerWidth;
    const leftEdgeStart = touch.clientX <= screenWidth * EDGE_MARGIN;
    if (leftEdgeStart) {
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      currentX.current = touch.clientX;
      setIsSwiping(true);
      setSwipeProgress(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.touches[0];
    const screenWidth = window.innerWidth;
    currentX.current = touch.clientX;

    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);

    if (deltaX > 0 && deltaX > deltaY * 0.5) {
      const progress = Math.min(deltaX / (screenWidth * SWIPE_THRESHOLD), 1);
      setSwipeProgress(progress);
      if (deltaX > deltaY) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);
    const screenWidth = window.innerWidth;

    if (deltaX > screenWidth * SWIPE_THRESHOLD && deltaX > deltaY) {
      onGoBack();
    }

    touchStartX.current = null;
    touchStartY.current = null;
    currentX.current = null;
    setIsSwiping(false);
    setSwipeProgress(0);
  };

  const getOverlayStyle = (): React.CSSProperties => {
    if (!isSwiping || touchStartX.current === null || currentX.current === null) {
      return {
        opacity: 0,
        pointerEvents: "none",
        transform: "translateX(-100%)",
      };
    }
    const deltaX = currentX.current - touchStartX.current;
    const translateX = Math.min(deltaX - window.innerWidth, 0);
    return {
      opacity: swipeProgress * 0.3,
      transform: `translateX(${translateX}px)`,
      transition: "none",
    };
  };

  return { handleTouchStart, handleTouchMove, handleTouchEnd, isSwiping, swipeProgress, getOverlayStyle };
}

// Swipe gesture hook for sidebar
export function useSidebarSwipe(
  isOpen: boolean,
  isRTL: boolean,
  onOpen: () => void,
  onClose: () => void,
) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const EDGE_THRESHOLD = 30; // px from edge to trigger open
  const SWIPE_THRESHOLD = 50; // min px to count as swipe

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    if (isOpen && Math.abs(deltaX) > Math.abs(deltaY)) {
      const isClosingDirection = isRTL ? deltaX > 0 : deltaX < 0;
      if (
        isClosingDirection &&
        sidebarRef.current?.contains(e.target as Node)
      ) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    if (
      Math.abs(deltaX) < Math.abs(deltaY) ||
      Math.abs(deltaX) < SWIPE_THRESHOLD
    ) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    if (!isOpen) {
      const startX = touchStartX.current;
      const isFromEdge = isRTL
        ? startX >= window.innerWidth - EDGE_THRESHOLD
        : startX <= EDGE_THRESHOLD;
      const isOpenDirection = isRTL ? deltaX < 0 : deltaX > 0;
      if (isFromEdge && isOpenDirection) {
        onOpen();
      }
    } else {
      const target = e.target as Node;
      if (sidebarRef.current?.contains(target)) {
        const isCloseDirection = isRTL ? deltaX > 0 : deltaX < 0;
        if (isCloseDirection) {
          onClose();
        }
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return { sidebarRef, handleTouchStart, handleTouchMove, handleTouchEnd };
}
