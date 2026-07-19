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

// Self-executing worker listener
self.onmessage = (e: MessageEvent<ModerationWorkerData>) => {
  const { messages, newMessage } = e.data;
  
  // Combine all strings into a massive context block
  const contextStr = [...messages, newMessage].join(' ').toLowerCase();

  // --- HEAVY DSA LAYER 1: Heuristics Iteration ---
  const deleteKeywords = [
    'i will kill', 'kill you', 'die', 'bomb', 'terrorist', 'shoot you', 'murder', 
    'gun', 'massacre', 'stabbing', 'cut you', 'blow up', 'arson',
    'faggot', 'nigger', 'retard', 'kike', 'spic', 'chink', 'dyke', 'tranny',
    'child porn', 'rape', 'pedophile', 'cp', 'drug deal', 'meth', 'heroin',
    'kys', 'kill yourself', 'commit suicide', 'slit my wrists'
  ];

  const suspendKeywords = [
    'idiot', 'stupid', 'loser', 'ugly', 'shut up', 'bitch', 'fuck you', 'asshole',
    'dick', 'cunt', 'whore', 'slut', 'piece of shit', 'garbage', 'trash', 'worthless',
    'pay me to do your homework', 'cheat sheet for sale', 'buy exams', 'test answers',
    'do my assignment', 'pay for essay', 'hire me to take your test',
    'crypto scam', 'click this link to win', 'bitcoin giveaway', 'free iphones',
    'hot girls in your area', 'forex trading', 'pyramid scheme'
  ];

  let action: 'ALLOW' | 'SUSPEND' | 'DELETE' = 'ALLOW';
  let toxicityProbability = 0;

  // 1A. Check for severe offenses
  for (const keyword of deleteKeywords) {
    if (contextStr.includes(keyword)) {
      action = 'DELETE';
      break;
    }
  }

  // 1B. Check for suspension-level offenses if not already deleted
  if (action !== 'DELETE') {
    let suspendHits = 0;
    for (const keyword of suspendKeywords) {
      if (contextStr.includes(keyword)) {
        suspendHits++;
      }
    }

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
  self.postMessage(result);
};
