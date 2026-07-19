import { ToxicityNeuralNet } from './neuralNetwork';

// Define the shape of the message sent to the worker
export interface ModerationWorkerData {
  messages: string[];
  newMessage: string;
}

// Define the shape of the message returned by the worker
export interface ModerationWorkerResult {
  action: 'ALLOW' | 'SUSPEND' | 'DELETE';
  toxicityProbability: number;
}

// --- GOD-TIER OPTIMIZATION: LRU CACHE ---
// We maintain a tiny Hash Map in RAM. If the user spams the same context,
// we pull the pre-computed math result instantly in O(1) time without firing
// the RegExp DFA or the SIMD Matrix Math.
const LRU_CACHE_LIMIT = 500;
const lruCache = new Map<string, ModerationWorkerResult>();

// Self-executing worker listener
self.onmessage = (e: MessageEvent<ModerationWorkerData>) => {
  const { messages, newMessage } = e.data;
  
  // Combine all strings into a massive context block
  const contextStr = [...messages, newMessage].join(' ').toLowerCase();

  // 1. O(1) Cache Hit Check
  if (lruCache.has(contextStr)) {
    self.postMessage(lruCache.get(contextStr));
    return;
  }

  // --- EXTREME DSA OPTIMIZATION: PRE-COMPILED REGEXP (DFA STATE MACHINE) ---
  // V8 engine compiles this into a Deterministic Finite Automaton for O(N) execution time
  // which is infinitely faster than iterating through arrays with .includes()
  const deletePattern = /\b(i will kill|kill you|die|bomb|terrorist|shoot you|murder|gun|massacre|stabbing|cut you|blow up|arson|faggot|nigger|retard|kike|spic|chink|dyke|tranny|child porn|rape|pedophile|cp|drug deal|meth|heroin|kys|kill yourself|commit suicide|slit my wrists)\b/i;

  const suspendPattern = /\b(idiot|stupid|loser|ugly|shut up|bitch|fuck you|asshole|dick|cunt|whore|slut|piece of shit|garbage|trash|worthless|pay me to do your homework|cheat sheet for sale|buy exams|test answers|do my assignment|pay for essay|hire me to take your test|crypto scam|click this link to win|bitcoin giveaway|free iphones|hot girls in your area|forex trading|pyramid scheme)\b/gi;

  let action: 'ALLOW' | 'SUSPEND' | 'DELETE' = 'ALLOW';
  let toxicityProbability = 0;

  // 1A. Check for severe offenses (O(N) execution time)
  if (deletePattern.test(contextStr)) {
    action = 'DELETE';
  }

  // 1B. Check for suspension-level offenses if not already deleted
  if (action !== 'DELETE') {
    // Count matches to detect repeated harassment
    const matches = contextStr.match(suspendPattern);
    const suspendHits = matches ? matches.length : 0;

    if (suspendHits >= 3) {
      action = 'DELETE'; // Repeated harassment over the context elevates to a ban
    } else if (suspendHits > 0) {
      action = 'SUSPEND'; // Single or minor offense is a suspension
    }
  }

  // --- HEAVY DSA LAYER 2: Neural Network Math Matrix ---
  // If the heuristic engine didn't catch anything, we fall back to the Custom Neural Network
  // to probabilistically evaluate the sentiment of the context for masked toxicity.
  if (action === 'ALLOW') {
    // This is mathematically expensive O(N) inference
    toxicityProbability = ToxicityNeuralNet.predict(contextStr);
    
    if (toxicityProbability >= 0.92) {
      action = 'DELETE'; // Highly confident neural prediction of extreme toxicity
    } else if (toxicityProbability >= 0.75) {
      action = 'SUSPEND'; // Confident neural prediction of suspension-level toxicity
    }
  }

  // Send the result back to the Main Thread
  const result: ModerationWorkerResult = { action, toxicityProbability };

  // 3. Save to O(1) Cache
  lruCache.set(contextStr, result);
  // Enforce memory limit to prevent RAM leaks
  if (lruCache.size > LRU_CACHE_LIMIT) {
    const firstKey = lruCache.keys().next().value;
    if (firstKey !== undefined) lruCache.delete(firstKey);
  }

  self.postMessage(result);
};
