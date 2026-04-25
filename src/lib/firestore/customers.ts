import { adminDb } from '@/lib/firebase/admin';
import type { Customer } from '@/types';

export async function getOrCreateCustomer(
  phone: string,
  name: string
): Promise<Customer> {
  const query = await adminDb
    .collection('customers')
    .where('phone', '==', phone)
    .limit(1)
    .get();

  if (!query.empty) {
    const doc = query.docs[0];
    return { id: doc.id, ...doc.data() } as Customer;
  }

  const ref = adminDb.collection('customers').doc();
  const customer: Omit<Customer, 'id'> = {
    name,
    phone,
    createdAt: Date.now(),
  };
  await ref.set(customer);
  return { id: ref.id, ...customer };
}
