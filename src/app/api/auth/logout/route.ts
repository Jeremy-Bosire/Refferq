import { NextRequest, NextResponse } from 'next/server';
import { shouldUseSecureAuthCookie } from '@/lib/auth-cookie';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear the auth token cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: shouldUseSecureAuthCookie(),
      sameSite: 'lax',
      expires: new Date(0) // Expire immediately
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
