import {mailConfigured} from '../../../../lib/mail-outbox.mjs';
import {NextResponse} from 'next/server';
import {authConfigured} from '../../../../lib/auth-policy.mjs';
export async function GET(){return NextResponse.json({configured:authConfigured(),emailConfigured:mailConfigured()},{headers:{'Cache-Control':'no-store'}})}
