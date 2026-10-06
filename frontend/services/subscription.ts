import api from './api';

export type SubscriptionAccessStatus = {
  evaluatedAt: string;
  state:
    | 'SUSPENDED'
    | 'SUBSCRIPTION_ACTIVE'
    | 'TRIAL_ACTIVE'
    | 'TRIAL_EXPIRED'
    | 'SUBSCRIPTION_REQUIRED';
  commercialAccess: boolean;
  enforcement: {
    status: 'PREPARED_NOT_APPLIED';
    message: string;
  };
  plan: {
    current: string;
    activeSubscriptionId: string | null;
    startsAt: string | null;
    endsAt: string | null;
  };
  trial: {
    startedAt: string;
    endsAt: string | null;
    daysRemaining: number;
  };
  latestPayment: {
    status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED';
    planType: string;
    startsAt: string;
    endsAt: string;
    subscriptionActive: boolean;
  } | null;
};

export async function getSubscriptionStatus() {
  const { data } = await api.get<SubscriptionAccessStatus>(
    '/subscription/status',
  );
  return data;
}
