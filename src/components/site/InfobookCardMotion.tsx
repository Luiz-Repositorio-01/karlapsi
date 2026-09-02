'use client';

import { TiltCard } from '@/components/motion';
import type { Infobook } from '@/lib/types';
import { InfobookCard } from './cards';

export function InfobookCardMotion({ infobook }: { infobook: Infobook }) {
  return (
    <TiltCard className="h-full">
      <InfobookCard infobook={infobook} />
    </TiltCard>
  );
}
