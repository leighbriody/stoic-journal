import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Seneca the Younger — Stoic philosopher, statesman, dramatist. You have been given a student's evening journal entry. Your role is to reflect on what they wrote with the same directness, warmth, and unsparing honesty you brought to your letters to Lucilius.

Guidelines for your character:
- Speak as Seneca would: measured, literary, occasionally sharp. Use the second person ("you") as in the Moral Letters.
- Do NOT flatter. Do not say "great job" or "well done." If they did something worthy, acknowledge it plainly — then push them further.
- If you see self-deception, avoidance, or drift — name it. Be kind, but do not let them off the hook. A true mentor tells the truth.
- Draw on Stoic principles naturally: the dichotomy of control, virtue as the sole good, memento mori, amor fati, the discipline of assent. But weave them in — do not lecture or list them.
- Keep responses concise. You are writing a letter, not a treatise. 3-6 paragraphs for the initial reflection.
- When they chat back, respond conversationally but stay in character. You may ask probing questions.
- Reference specific things they wrote — show you read carefully.
- Occasionally quote yourself (Seneca), Marcus Aurelius, or Epictetus when it fits naturally — but sparingly.
- Remember: your goal is their growth, not their comfort.`;

export async function POST(request: Request) {
  const { messages, journalEntry } = await request.json();

  const formattedEntry = [
    journalEntry.mindRightNow && `**What's on my mind:** ${journalEntry.mindRightNow}`,
    journalEntry.didWell && `**What I did well:** ${journalEntry.didWell}`,
    journalEntry.fellShort && `**Where I fell short:** ${journalEntry.fellShort}`,
    journalEntry.actedIntentionally && `**Intentional or reactive:** ${journalEntry.actedIntentionally}`,
    journalEntry.outsideControl && `**Outside my control:** ${journalEntry.outsideControl}`,
    journalEntry.followedThrough && `**Followed through:** ${journalEntry.followedThrough}`,
    journalEntry.smallWin && `**Small win:** ${journalEntry.smallWin}`,
    journalEntry.drifting && `**Where I'm drifting:** ${journalEntry.drifting}`,
    journalEntry.improveTomorrow && `**To improve tomorrow:** ${journalEntry.improveTomorrow}`,
    journalEntry.avoiding && `**What I'm avoiding:** ${journalEntry.avoiding}`,
    journalEntry.whatMatters && `**What actually matters:** ${journalEntry.whatMatters}`,
    journalEntry.letGo && `**What I can let go of:** ${journalEntry.letGo}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const apiMessages: Anthropic.MessageParam[] = [];

  // First message always includes the journal context
  if (messages.length === 0 || messages[0].role === 'system') {
    apiMessages.push({
      role: 'user',
      content: `Here is my evening journal entry for today:\n\n${formattedEntry}\n\nReflect on this as Seneca would — be honest with me.`,
    });
  } else {
    // Include journal context in first user message, then append conversation
    apiMessages.push({
      role: 'user',
      content: `Here is my evening journal entry for today:\n\n${formattedEntry}\n\nReflect on this as Seneca would — be honest with me.`,
    });
    // Add the rest of the conversation (skip the first user message since we replaced it)
    for (let i = 1; i < messages.length; i++) {
      apiMessages.push({
        role: messages[i].role,
        content: messages[i].content,
      });
    }
  }

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: apiMessages,
  });

  // Return a streaming response
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
