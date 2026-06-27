import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Lightweight health-check endpoint.
 * Purpose: Keep the AWS Lambda warm by being pinged every 5 minutes
 * via UptimeRobot / BetterStack / any uptime monitor.
 * A warm Lambda = no cold start = page loads in <500ms instead of 20s+.
 *
 * Setup: https://uptimerobot.com → New Monitor → HTTP(s) → your-domain.com/api/health → 5 min
 */
export async function GET() {
  return NextResponse.json(
    { status: 'ok', ts: Date.now() },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache',
        'X-Robots-Tag': 'noindex',
      },
    }
  );
}
