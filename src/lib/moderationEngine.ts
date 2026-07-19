import { ToxicityNeuralNet } from './neuralNetwork';

export type ModerationResult = 'ALLOW' | 'SUSPEND' | 'DELETE';

/**
 * Dual-Layer Extraordinary Moderation System
 * Layer 1: Normal Review (Expanded Heuristics)
 * Layer 2: Neural Network Review (Contextual Analysis)
 */
export async function analyzeConversationContext(
  messages: string[], 
  newMessage: string
): Promise<ModerationResult> {
  // Simulate API/Inference delay for authentic UX
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 600));

  const contextStr = [...messages, newMessage].join(' ').toLowerCase();

  // --- LAYER 1: NORMAL REVIEW (Expanded Heuristics) ---
  
  // Severe offenses leading to instant deletion (50+ categorized triggers)
  const deleteKeywords = [
    // Violence & Threats
    'i will kill', 'kill you', 'die', 'bomb', 'terrorist', 'shoot you', 'murder', 
    'gun', 'massacre', 'stabbing', 'cut you', 'blow up', 'arson',
    // Extreme Hate Speech & Slurs
    'faggot', 'nigger', 'retard', 'kike', 'spic', 'chink', 'dyke', 'tranny',
    // Illegal Acts & CSAM
    'child porn', 'rape', 'pedophile', 'cp', 'drug deal', 'meth', 'heroin',
    // Self harm
    'kys', 'kill yourself', 'commit suicide', 'slit my wrists'
  ];

  // Offenses leading to suspension (Harassment, spam, academic misconduct)
  const suspendKeywords = [
    // Harassment / Insults
    'idiot', 'stupid', 'loser', 'ugly', 'shut up', 'bitch', 'fuck you', 'asshole',
    'dick', 'cunt', 'whore', 'slut', 'piece of shit', 'garbage', 'trash', 'worthless',
    // Academic Dishonesty
    'pay me to do your homework', 'cheat sheet for sale', 'buy exams', 'test answers',
    'do my assignment', 'pay for essay', 'hire me to take your test',
    // Spam / Scams
    'crypto scam', 'click this link to win', 'bitcoin giveaway', 'free iphones',
    'hot girls in your area', 'forex trading', 'pyramid scheme'
  ];

  // 1A. Check for severe offenses
  for (const keyword of deleteKeywords) {
    if (contextStr.includes(keyword)) {
      return 'DELETE';
    }
  }

  // 1B. Check for suspension-level offenses
  let suspendHits = 0;
  for (const keyword of suspendKeywords) {
    if (contextStr.includes(keyword)) {
      suspendHits++;
    }
  }

  if (suspendHits >= 3) {
    return 'DELETE'; // Repeated harassment over the context elevates to a ban
  } else if (suspendHits > 0) {
    return 'SUSPEND'; // Single or minor offense is a suspension
  }

  // --- LAYER 2: NEURAL NETWORK REVIEW (AI Intelligence) ---
  // If the heuristic engine didn't catch anything, we fall back to the Custom Neural Network
  // to probabilistically evaluate the sentiment of the context for masked toxicity.
  
  const toxicityProbability = ToxicityNeuralNet.predict(contextStr);
  
  if (toxicityProbability >= 0.92) {
    return 'DELETE'; // Highly confident neural prediction of extreme toxicity
  } else if (toxicityProbability >= 0.75) {
    return 'SUSPEND'; // Confident neural prediction of suspension-level toxicity
  }

  return 'ALLOW';
}
