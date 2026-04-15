'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface Slide {
    image: string;
    mobileImage?: string;
    title: string;
    subtitle: string;
    link: string;
    buttonText: string;
}

export const HeroSlider = ({ slides }: { slides: Slide[] }) => {
    const [current, setCurrent] = useState(0);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const scrollRafRef = useRef<number | null>(null);
    const slideCount = slides?.length || 0;

    const scrollToIndex = useCallback((index: number) => {
        if (!scrollRef.current) return;
        const slideWidth = scrollRef.current.clientWidth;
        scrollRef.current.scrollTo({
            left: slideWidth * index,
            behavior: 'smooth'
        });
    }, []);

    // Auto-advance timer. Resets on manual interaction.
    const resetTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (slideCount <= 1) return;
        timerRef.current = setInterval(() => {
            setCurrent((prev) => {
                const next = (prev + 1) % slideCount;
                scrollToIndex(next);
                return next;
            });
        }, 6000);
    }, [slideCount, scrollToIndex]);

    useEffect(() => {
        resetTimer();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
        };
    }, [resetTimer]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 767px)');
        const syncViewport = () => setIsMobileViewport(mediaQuery.matches);
        syncViewport();

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', syncViewport);
            return () => mediaQuery.removeEventListener('change', syncViewport);
        }

        mediaQuery.addListener(syncViewport);
        return () => mediaQuery.removeListener(syncViewport);
    }, []);

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        if (scrollRafRef.current !== null) return;

        scrollRafRef.current = requestAnimationFrame(() => {
            if (!scrollRef.current) {
                scrollRafRef.current = null;
                return;
            }

            const slideWidth = scrollRef.current.clientWidth;
            const scrollPosition = scrollRef.current.scrollLeft;
            const nextIndex = Math.round(scrollPosition / slideWidth);
            setCurrent((prev) => (prev === nextIndex ? prev : nextIndex));
            scrollRafRef.current = null;
        });
    }, []);

    const goToSlide = useCallback((index: number) => {
        scrollToIndex(index);
        setCurrent(index);
        resetTimer();
    }, [scrollToIndex, resetTimer]);

    if (!slides || slideCount === 0) return null;

    return (
        <div
            className="relative w-full aspect-video overflow-hidden bg-stone-900 group"
            style={{ touchAction: 'pan-y' }}
        >
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
                style={{ touchAction: 'pan-x pan-y', willChange: 'scroll-position' }}
            >
                {slides.map((slide, index) => {
                    const isActive = index === current;
                    const isFirst = index === 0;
                    const fallbackSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                    const desktopSrc = slide.image || fallbackSrc;
                    const imgSrc = (isMobileViewport && slide.mobileImage) ? slide.mobileImage : desktopSrc;

                    return (
                        <div
                            key={index}
                            className="w-full h-full flex-shrink-0 snap-center relative"
                        >
                            <Image
                                src={imgSrc}
                                className="object-cover object-center"
                                alt={slide.title || 'Luxe Moon Hero'}
                                fill
                                quality={isFirst ? 85 : 75}
                                priority={isFirst}
                                loading={isFirst ? 'eager' : 'lazy'}
                                sizes="(max-width: 768px) 100vw, 100vw"
                                fetchPriority={isFirst ? 'high' : 'auto'}
                                decoding={isFirst ? 'sync' : 'async'}
                            />

                            <div className="absolute inset-0 bg-black/25 pointer-events-none" />

                            <div className="absolute inset-0 flex items-center justify-center text-center px-4 sm:px-6 md:px-12">
                                <div
                                    className={`max-w-4xl space-y-2 sm:space-y-3 md:space-y-5 w-full transition-all duration-700 ${
                                        isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                    }`}
                                >
                                    <h2
                                        className="font-serif text-2xl sm:text-3xl md:text-5xl lg:text-6xl text-white leading-[1.1] tracking-tight"
                                        style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)' }}
                                    >
                                        {slide.title}
                                    </h2>
                                    <p
                                        className="text-white/90 text-xs sm:text-sm md:text-base lg:text-lg font-light tracking-wide max-w-2xl mx-auto leading-relaxed line-clamp-2 sm:line-clamp-none"
                                        style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
                                    >
                                        {slide.subtitle}
                                    </p>
                                    <div className="pt-1 sm:pt-2 md:pt-4 flex justify-center w-full">
                                        <Link
                                            href={slide.link || '/shop'}
                                            className="inline-flex items-center justify-center gap-2 group/btn px-5 py-2 sm:px-7 sm:py-2.5 md:px-10 md:py-3.5 bg-white text-stone-900 font-bold rounded-full hover:bg-stone-100 hover:scale-105 transition-all shadow-xl text-[11px] sm:text-xs md:text-sm lg:text-base active:scale-95 border border-white/80"
                                        >
                                            {slide.buttonText || 'SHOP NOW'}
                                            <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {slideCount > 1 && (
                <>
                    <div className="absolute bottom-2.5 sm:bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2.5 z-20">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goToSlide(i)}
                                aria-label={`Go to slide ${i + 1}`}
                                className={`transition-all duration-500 rounded-full h-1 sm:h-1.5 ${
                                    i === current
                                        ? 'w-6 sm:w-10 bg-white'
                                        : 'w-3 sm:w-4 bg-white/40 hover:bg-white/60'
                                }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => goToSlide((current - 1 + slideCount) % slideCount)}
                        aria-label="Previous slide"
                        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white hover:text-stone-900 border border-white/20 transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 hidden md:flex"
                    >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button
                        onClick={() => goToSlide((current + 1) % slideCount)}
                        aria-label="Next slide"
                        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white hover:text-stone-900 border border-white/20 transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 hidden md:flex"
                    >
                        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </>
            )}
        </div>
    );
};
