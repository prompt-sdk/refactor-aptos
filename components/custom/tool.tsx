'use client';

import { ChatHeader } from '@/components/custom/chat-header';
import { Model } from '@/lib/model';

export function Tool({
  selectedModelName,
}: {
  selectedModelName: Model['name'];
}) {

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <ChatHeader selectedModelName={selectedModelName} />
      <div
       className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll"
     >GM
      </div>
    </div>
       
  );
}
