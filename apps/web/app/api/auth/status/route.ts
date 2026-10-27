import {NextResponse} from 'next/server';
import {authConfigured} from '../../../../lib/auth-policy.mjs';
export async function GET(){return NextResponse.json({configured:authConfigured()},{headers:{'Cache-Control':'no-store'}})}
