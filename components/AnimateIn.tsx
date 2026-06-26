'use client';

/**
 * AnimateIn / StaggerContainer / StaggerItem
 *
 * Pure CSS + IntersectionObserver implementation.
 * Replaces framer-motion (~90 KB gzipped) with zero runtime dependencies.
 * Identical public API — existing call sites require no changes except that
 * StaggerItem now accepts an optional `staggerIndex` prop for correct delays.
 */

import React, {
  useRef,
  useEffect,
  useState,
  useContext,
  createContext,
  useMemo,
} from 'react';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const EASE = 'cubic-bezier(0.21, 0.47, 0.32, 0.98)';

const DIRECTION_TRANSFORM: Record<string, string> = {
  up: 'translateY(24px)',
  down: 'translateY(-24px)',
  left: 'translateX(24px)',
  right: 'translateX(-24px)',
  none: 'translateY(0)',
};

/** One shared IntersectionObserver hook — fires once, then disconnects. */
function useIntersectionOnce(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Graceful degradation: show immediately if IO is not supported
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// ---------------------------------------------------------------------------
// AnimateIn
// ---------------------------------------------------------------------------

interface AnimateInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  threshold?: number;
}

export function AnimateIn({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 0.6,
  threshold = 0.1,
}: AnimateInProps) {
  const { ref, inView } = useIntersectionOnce(threshold);
  const transform = DIRECTION_TRANSFORM[direction] ?? 'translateY(24px)';

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : transform,
        // Apply transition only when animating in to avoid un-animate on scroll back
        transition: inView
          ? `opacity ${duration}s ${EASE} ${delay}s, transform ${duration}s ${EASE} ${delay}s`
          : undefined,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StaggerContainer + StaggerItem
// ---------------------------------------------------------------------------

interface StaggerCtx {
  visible: boolean;
  delayChildren: number;
  staggerChildren: number;
}

const StaggerContext = createContext<StaggerCtx>({
  visible: false,
  delayChildren: 0,
  staggerChildren: 0.1,
});

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  delayChildren?: number;
  staggerChildren?: number;
}

export function StaggerContainer({
  children,
  className = '',
  threshold = 0.1,
  delayChildren = 0,
  staggerChildren = 0.1,
}: StaggerContainerProps) {
  const { ref, inView } = useIntersectionOnce(threshold);

  const ctx = useMemo<StaggerCtx>(
    () => ({ visible: inView, delayChildren, staggerChildren }),
    [inView, delayChildren, staggerChildren]
  );

  return (
    <StaggerContext.Provider value={ctx}>
      <div ref={ref} className={className}>
        {children}
      </div>
    </StaggerContext.Provider>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Zero-based index within the parent StaggerContainer. Defaults to 0. */
  staggerIndex?: number;
}

export function StaggerItem({
  children,
  className = '',
  direction = 'up',
  staggerIndex = 0,
}: StaggerItemProps) {
  const { visible, delayChildren, staggerChildren } = useContext(StaggerContext);
  const delay = delayChildren + staggerIndex * staggerChildren;
  const transform = DIRECTION_TRANSFORM[direction] ?? 'translateY(20px)';

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : transform,
        transition: visible
          ? `opacity 0.5s ${EASE} ${delay}s, transform 0.5s ${EASE} ${delay}s`
          : undefined,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}
