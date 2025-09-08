/**
 * Performance Detection Utility
 * Detects device performance capabilities for UI optimization
 */

class PerformanceDetector {
  constructor() {
    this.isLowPerformance = null;
    this.adminFallbackEnabled = this.getAdminFallbackSetting();
  }

  /**
   * Get admin fallback setting from localStorage
   */
  getAdminFallbackSetting() {
    try {
      const setting = localStorage.getItem('admin_animation_fallback');
      return setting === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Set admin fallback setting
   */
  setAdminFallbackSetting(enabled) {
    try {
      localStorage.setItem('admin_animation_fallback', enabled.toString());
      this.adminFallbackEnabled = enabled;
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  /**
   * Detect if device has low performance capabilities
   */
  detectLowPerformance() {
    if (this.isLowPerformance !== null) {
      return this.isLowPerformance;
    }

    let score = 0;
    const factors = [];

    // Check hardware concurrency (CPU cores)
    if (navigator.hardwareConcurrency) {
      if (navigator.hardwareConcurrency <= 2) {
        score += 2;
        factors.push('Low CPU cores');
      } else if (navigator.hardwareConcurrency <= 4) {
        score += 1;
        factors.push('Medium CPU cores');
      }
    }

    // Check device memory (if available)
    if (navigator.deviceMemory) {
      if (navigator.deviceMemory <= 2) {
        score += 2;
        factors.push('Low RAM');
      } else if (navigator.deviceMemory <= 4) {
        score += 1;
        factors.push('Medium RAM');
      }
    }

    // Check connection speed
    if (navigator.connection) {
      const connection = navigator.connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        score += 2;
        factors.push('Slow connection');
      } else if (connection.effectiveType === '3g') {
        score += 1;
        factors.push('Medium connection');
      }
    }

    // Check if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    if (isMobile) {
      score += 1;
      factors.push('Mobile device');
    }

    // Check battery level (if available)
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        if (battery.level < 0.2) {
          score += 1;
          factors.push('Low battery');
        }
      }).catch(() => {});
    }

    // Performance timing check
    if (performance && performance.timing) {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      if (loadTime > 3000) {
        score += 1;
        factors.push('Slow page load');
      }
    }

    this.isLowPerformance = score >= 3;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Detection:', {
        score,
        factors,
        isLowPerformance: this.isLowPerformance,
        adminFallbackEnabled: this.adminFallbackEnabled
      });
    }

    return this.isLowPerformance;
  }

  /**
   * Should use fallback mode (static instead of animated)
   */
  shouldUseFallback() {
    return this.adminFallbackEnabled || this.detectLowPerformance();
  }

  /**
   * Perform a simple animation performance test
   */
  async testAnimationPerformance() {
    return new Promise((resolve) => {
      const testElement = document.createElement('div');
      testElement.style.cssText = `
        position: fixed;
        top: -100px;
        left: -100px;
        width: 50px;
        height: 50px;
        background: red;
        transition: transform 0.1s;
      `;
      
      document.body.appendChild(testElement);
      
      let frameCount = 0;
      const startTime = performance.now();
      
      const animate = () => {
        frameCount++;
        testElement.style.transform = `rotate(${frameCount * 10}deg)`;
        
        if (frameCount < 60) {
          requestAnimationFrame(animate);
        } else {
          const endTime = performance.now();
          const duration = endTime - startTime;
          const fps = (frameCount / duration) * 1000;
          
          document.body.removeChild(testElement);
          
          // If FPS is below 30, consider it low performance
          resolve(fps < 30);
        }
      };
      
      requestAnimationFrame(animate);
    });
  }
}

// Create singleton instance
const performanceDetector = new PerformanceDetector();

export default performanceDetector;

// Export utility functions
export const shouldUseFallback = () => performanceDetector.shouldUseFallback();
export const setAdminFallback = (enabled) => performanceDetector.setAdminFallbackSetting(enabled);
export const getAdminFallback = () => performanceDetector.getAdminFallbackSetting();
export const testAnimationPerformance = () => performanceDetector.testAnimationPerformance();