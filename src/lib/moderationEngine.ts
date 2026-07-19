import type { ModerationWorkerData, ModerationWorkerResult } from './moderationWorker';

export type ModerationResult = 'ALLOW' | 'SUSPEND' | 'DELETE';

/**
 * Dual-Layer Extraordinary Moderation System (MULTITHREADED)
 * We offload the heavy Data Structures (Heuristics) and Matrix Math (Neural Networks) 
 * to a dedicated Web Worker so the main UI thread remains at a buttery 120 FPS.
 */
export async function analyzeConversationContext(
  messages: string[], 
  newMessage: string
): Promise<ModerationResult> {
  
  return new Promise((resolve, reject) => {
    try {
      // Spawn a new Background Thread (Web Worker)
      // Using Vite's ?worker suffix to compile the worker properly
      const worker = new Worker(new URL('./moderationWorker.ts', import.meta.url), {
        type: 'module'
      });

      // Prepare the payload for the background thread
      const payload: ModerationWorkerData = { messages, newMessage };

      // Listen for the AI's multithreaded response
      worker.onmessage = (event: MessageEvent<ModerationWorkerResult>) => {
        const { action } = event.data;
        worker.terminate(); // Clean up thread memory
        resolve(action);
      };

      // Handle Thread errors
      worker.onerror = (error) => {
        console.error("Multithreaded DSA Worker Failed:", error);
        worker.terminate(); // Clean up thread memory
        resolve('ALLOW'); // Failsafe: if AI thread crashes, don't permanently ban user
      };

      // Dispatch payload to the background thread to begin heavy lifting
      worker.postMessage(payload);
      
    } catch (e) {
      // Fallback in case Web Workers are not supported in the user's environment
      console.warn("Web Workers not supported. Falling back to safe ALLOW.");
      resolve('ALLOW');
    }
  });
}
