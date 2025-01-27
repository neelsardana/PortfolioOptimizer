'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export default function FloatingBackground() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isHomePage) return;
    
    const floatingElements = document.getElementById('floatingElements');
    if (!floatingElements) return;

    // Calculate cursor position relative to center of screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    // Calculate movement amount (max 20px in any direction)
    const maxMove = 20;
    const distance = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
    
    // If cursor is at center, reset position
    if (distance < 5) {
      floatingElements.style.transform = 'translate(0px, 0px)';
      return;
    }

    // Calculate normalized movement
    const normalizedX = (mouseX / Math.max(distance, 1)) * maxMove;
    const normalizedY = (mouseY / Math.max(distance, 1)) * maxMove;

    // Move the entire container
    floatingElements.style.transform = `translate(${normalizedX}px, ${normalizedY}px)`;
  }, [isHomePage]);

  useEffect(() => {
    const floatingElements = document.getElementById('floatingElements');
    if (floatingElements) {
      // Clear any existing elements
      floatingElements.innerHTML = '';
      
      // Create new elements with initial random positions
      for (let i = 0; i < 200; i++) {
        const element = document.createElement('div');
        element.className = 'w-1 h-1 bg-white rounded-full absolute opacity-20';
        element.style.left = `${Math.random() * 100}%`;
        element.style.top = `${Math.random() * 100}%`;
        floatingElements.appendChild(element);
      }

      if (isHomePage) {
        // Add mousemove event listener with throttling
        let lastTime = 0;
        const throttleInterval = 1000 / 60; // 60 FPS

        const throttledMouseMove = (e: MouseEvent) => {
          const currentTime = Date.now();
          if (currentTime - lastTime >= throttleInterval) {
            handleMouseMove(e);
            lastTime = currentTime;
          }
        };

        window.addEventListener('mousemove', throttledMouseMove);

        // Add mouseleave event to reset position
        const handleMouseLeave = () => {
          floatingElements.style.transform = 'translate(0px, 0px)';
        };
        window.addEventListener('mouseleave', handleMouseLeave);

        // Cleanup
        return () => {
          window.removeEventListener('mousemove', throttledMouseMove);
          window.removeEventListener('mouseleave', handleMouseLeave);
        };
      }
    }
  }, [handleMouseMove, isHomePage]);

  return (
    <div 
      id="floatingElements" 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={isHomePage ? { transition: 'transform 0.3s ease-out' } : undefined}
    />
  );
} 