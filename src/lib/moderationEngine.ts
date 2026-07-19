export type ModerationResult = 'ALLOW' | 'SUSPEND' | 'DELETE';

/**
 * Intelligent Mock Context Engine
 * 
 * Analyzes the entire context of a conversation to determine malicious intent.
 * - DELETION triggers: extreme hate speech, severe threats, illegal content.
 * - SUSPENSION triggers: harassment, spam, academic misconduct (cheating).
 * - ALLOW: Benign educational discussion.
 */
export async function analyzeConversationContext(
  messages: string[], 
  newMessage: string
): Promise<ModerationResult> {
  // Simulate AI model inference delay (feels like a real API call)
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 600));

  const contextStr = [...messages, newMessage].join(' ').toLowerCase();

  // Severe offenses leading to instant deletion
  const deleteKeywords = [
    'i will kill', 'kill you', 'die', 'bomb', 'terrorist',
    'faggot', 'nigger', 'retard', 'child porn', 'rape'
  ];

  // Offenses leading to suspension (harassment, spam, academic cheating)
  const suspendKeywords = [
    'idiot', 'stupid', 'loser', 'ugly', 'shut up', 'bitch', 'fuck you',
    'pay me to do your homework', 'cheat sheet for sale', 'buy exams',
    'crypto scam', 'click this link to win'
  ];

  // 1. Check for extreme offenses anywhere in the context
  for (const keyword of deleteKeywords) {
    if (contextStr.includes(keyword)) {
      return 'DELETE';
    }
  }

  // 2. Check for suspension-level offenses
  // If the context is heavily toxic (multiple suspension keywords), escalate to DELETE?
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

  return 'ALLOW';
}
