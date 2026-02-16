'use client';

import { AppShell } from '@/components/layout/AppShell';
import { QuickCaptureModal } from '@/components/captures/QuickCaptureModal';
import { FloatingCaptureButton } from '@/components/captures/FloatingCaptureButton';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <QuickCaptureModal />
      <FloatingCaptureButton />
    </>
  );
}
