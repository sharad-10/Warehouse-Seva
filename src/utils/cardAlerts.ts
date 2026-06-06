import { Card, CardField } from "../types/index";

export interface AlertPreview {
  cardId: string;
  cardName: string;
  fieldId: string;
  fieldLabel: string;
  alertDate: string;
  isDue: boolean;
  isUpcoming: boolean;
  message: string;
}

const EXPIRY_RE = /expir/i; // matches: expiry, expire, expiration, expires, expiring

function isAlertField(field: CardField): boolean {
  if (!field.value) return false;
  // Explicit alert type (legacy) OR any date/datetime field whose label contains "expir"
  return (
    field.type === "alert" ||
    ((field.type === "date" || field.type === "datetime") && EXPIRY_RE.test(field.label))
  );
}

function buildMessage(cardName: string, diffDays: number): string {
  if (diffDays < -1) return `Your ${cardName} expired ${Math.abs(Math.round(diffDays))} days ago`;
  if (diffDays < 0)  return `Your ${cardName} expired yesterday`;
  if (diffDays < 1)  return `Your ${cardName} is expiring today`;
  if (diffDays < 2)  return `Your ${cardName} is going to expire tomorrow`;
  return `Your ${cardName} is going to expire in ${Math.floor(diffDays)} days`;
}

export function getAlertPreviews(cards: Card[], upcomingDays = 7): AlertPreview[] {
  const now = new Date();
  const results: AlertPreview[] = [];

  for (const card of cards) {
    for (const field of card.fields) {
      if (!isAlertField(field) || !field.value) continue;

      const alertDate = new Date(field.value);
      if (isNaN(alertDate.getTime())) continue;

      const diffMs = alertDate.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      results.push({
        cardId: card.id,
        cardName: card.name,
        fieldId: field.id,
        fieldLabel: field.label,
        alertDate: field.value,
        isDue: diffDays <= 0,
        isUpcoming: diffDays > 0 && diffDays <= upcomingDays,
        message: buildMessage(card.name, diffDays),
      });
    }
  }

  results.sort((a, b) => a.alertDate.localeCompare(b.alertDate));
  return results;
}

export function formatAlertDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  return `In ${diffDays} days`;
}
