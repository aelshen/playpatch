/**
 * Server Actions for Child Requests
 */

'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentFamilyId } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';

async function verifyRequestOwnership(requestId: string, familyId: string) {
  const request = await prisma.requestFromChild.findUnique({
    where: { id: requestId },
    include: { child: { include: { user: { select: { familyId: true } } } } },
  });
  if (!request || request.child.user.familyId !== familyId) {
    throw new Error('Request not found or access denied');
  }
  return request;
}

export async function fulfillRequestAction(requestId: string) {
  try {
    const familyId = await getCurrentFamilyId();
    await verifyRequestOwnership(requestId, familyId);
    await prisma.requestFromChild.update({
      where: { id: requestId },
      data: { status: 'FULFILLED' },
    });
    revalidatePath('/admin/requests');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('fulfillRequestAction error:', error);
    return { success: false, error: 'Failed to update request.' };
  }
}

export async function dismissRequestAction(requestId: string) {
  try {
    const familyId = await getCurrentFamilyId();
    await verifyRequestOwnership(requestId, familyId);
    await prisma.requestFromChild.update({
      where: { id: requestId },
      data: { status: 'DISMISSED' },
    });
    revalidatePath('/admin/requests');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('dismissRequestAction error:', error);
    return { success: false, error: 'Failed to update request.' };
  }
}
