// E2E test accounts live on this domain and have no mailboxes, so mail to them bounces
// and hurts the sender reputation of devmapper.africa.
export const isTestAccountEmail = (email: string | null | undefined): boolean =>
  !!email && email.toLowerCase().endsWith('@test.devmapper.africa');
