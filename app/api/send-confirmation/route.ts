import { NextRequest, NextResponse } from 'next/server'
import { sendConfirmationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, filename, submittedAt } = body

    if (!to || !filename || !submittedAt) {
      return NextResponse.json(
        { error: 'Missing required fields: to, filename, submittedAt' },
        { status: 400 }
      )
    }

    await sendConfirmationEmail({ to, filename, submittedAt })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[send-confirmation] Error:', error)
    return NextResponse.json(
      { error: 'Failed to send confirmation email' },
      { status: 500 }
    )
  }
}
