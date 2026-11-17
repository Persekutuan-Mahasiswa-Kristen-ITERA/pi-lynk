import { NextResponse } from 'next/server';
import { signOutHere } from '@/auth';

/** POST /auth/logout: end the PI-CORE session on this site, back to the login page. */
export async function POST() {
  await signOutHere();
  return new NextResponse(null, { status: 303, headers: { Location: '/admin/login' } });
}
