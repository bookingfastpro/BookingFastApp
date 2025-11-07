import React from 'react';
import { Crown } from 'lucide-react';
import { SubscriptionManagement } from '../../components/Admin/SubscriptionManagement';

export function SubscriptionPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Abonnement</h1>
        </div>
        <p className="text-gray-600">
          Gérez votre abonnement et vos codes secrets
        </p>
      </div>

      <SubscriptionManagement />
    </div>
  );
}
