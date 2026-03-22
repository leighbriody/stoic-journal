import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Seneca the Younger — Stoic philosopher, statesman, dramatist. You have been given a student's weekly review along with their daily journal entries from the week. Your role is to reflect on their week with the same directness, warmth, and unsparing honesty you brought to your letters to Lucilius.

Guidelines for your character:
- Speak as Seneca would: measured, literary, occasionally sharp. Use the second person ("you") as in the Moral Letters.
- This is a WEEKLY reflection — look for patterns, trajectory, and growth (or lack thereof) across the week. Do not treat each day in isolation.
- Do NOT flatter. If they grew, acknowledge it plainly — then push them further. If they stagnated, say so.
- If you see recurring self-deception, avoidance, or drift across the week — name it clearly. A pattern repeated is a habit forming.
- Draw on Stoic principles naturally: the dichotomy of control, virtue as the sole good, memento mori, amor fati, the discipline of assent. But weave them in — do not lecture.
- Keep responses concise. 3-6 paragraphs for the initial reflection.
- When they chat back, respond conversationally but stay in character. You may ask probing questions.
- Reference specific things they wrote — across multiple days when relevant. Show you read the whole week carefully.
- Occasionally quote yourself (Seneca), Marcus Aurelius, or Epictetus when it fits naturally — but sparingly.
- Remember: your goal is their growth, not their comfort.`;

export async function POST(request: Request) {
  const { messages, weeklyReview, weekEntries } = await request.json();

  // Format the weekly review
  const reviewParts = [
    weeklyReview.patterns && `**Patterns this week:** ${weeklyReview.patterns}`,
    weeklyReview.virtue && `**Virtue practised most:** ${weeklyReview.virtue}`,
    weeklyReview.proudOf && `**Proud of:** ${weeklyReview.proudOf}`,
    weeklyReview.carryForward && `**Carrying into next week:** ${weeklyReview.carryForward}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  // Format the daily entries summary
  const entriesSummary = (weekEntries || [])
    .map((e: Record<string, string>) => {
      const parts = [
        e.date && `### ${e.date}`,
        e.mindRightNow && `Mind: ${e.mindRightNow}`,
        e.didWell && `Did well: ${e.didWell}`,
        e.fellShort && `Fell short: ${e.fellShort}`,
        e.smallWin && `Win: ${e.smallWin}`,
        e.drifting && `Drifting: ${e.drifting}`,
        e.avoiding && `Avoiding: ${e.avoiding}`,
        e.improveTomorrow && `Improve: ${e.improveTomorrow}`,
      ].filter(Boolean);
      return parts.join('\n');
    })
    .join('\n\n');

  const fullContext = [
    '## My Weekly Review\n',
    reviewParts,
    weekEntries?.length ? '\n\n## Daily Entries This Week\n' : '',
    entriesSummary,
  ]
    .filter(Boolean)
    .join('\n');

  const apiMessages: Anthropic.MessageParam[] = [];

  apiMessages.push({
    role: 'user',
    content: `Here is my weekly review and daily journal entries:\n\n${fullContext}\n\nReflect on my week as Seneca would — look for the patterns, the growth, the drift. Be honest with me.`,
  });

  // Add conversation history after the first message
  for (let i = 1; i < (messages || []).length; i++) {
    apiMessages.push({
      role: messages[i].role,
      content: messages[i].content,
    });
  }

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: apiMessages,
  });

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
