'use client';

import { TiltCard } from '@/components/motion';
import type { Infobook } from '@/lib/types';
import { InfobookCard } from './cards';

export function InfobookCardMotion({
  infobook,
  featured = false,
}: {
  infobook: Infobook;
  featured?: boolean;
}) {
  return (
    <TiltCard>
      <InfobookCard infobook={infobook} featured={featured} />
    </TiltCard>
  );
}
