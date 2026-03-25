import { Rack, RackAlert, Stick } from "@/src/types/warehouse";

export type RackAlertPreview = {
  rackId: string;
  rackName: string;
  stickName: string;
  material: string;
  type: RackAlert["type"];
  nextTriggerDate: string;
  isDue: boolean;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const parseDate = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * MS_PER_DAY);

const formatDate = (date: Date) => date.toISOString().split("T")[0];

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const getNextRackAlertDate = (
  entryDate: string | undefined,
  alert: RackAlert,
  now = startOfToday(),
) => {
  const baseDate = parseDate(entryDate);
  if (!baseDate) {
    return null;
  }

  let nextDate = addDays(baseDate, Math.max(1, alert.offsetDays));

  while (nextDate < now) {
    nextDate = addDays(nextDate, Math.max(1, alert.offsetDays));
  }

  return nextDate;
};

export const getRackAlertPreviews = (racks: Rack[], sticks: Stick[]) => {
  const today = startOfToday();
  const stickNameById = new Map(sticks.map((stick) => [stick.id, stick.name]));

  return racks
    .flatMap((rack): RackAlertPreview[] =>
      (rack.alerts ?? [])
        .map((alert) => {
          const nextDate = getNextRackAlertDate(rack.entryDate, alert, today);
          if (!nextDate) {
            return null;
          }

          return {
            rackId: rack.id,
            rackName: rack.name,
            stickName: stickNameById.get(rack.stickId ?? "") ?? "-",
            material: rack.material ?? "",
            type: alert.type,
            nextTriggerDate: formatDate(nextDate),
            isDue: nextDate <= today,
          };
        })
        .filter((preview): preview is RackAlertPreview => preview !== null),
    )
    .sort((a, b) => a.nextTriggerDate.localeCompare(b.nextTriggerDate));
};

export const formatRackAlertDate = (date: Date | null) => {
  if (!date) {
    return "";
  }

  return formatDate(date);
};

export const getUpcomingRackAlertDates = (
  entryDate: string | undefined,
  alert: RackAlert,
  count = 12,
  now = startOfToday(),
) => {
  const firstDate = getNextRackAlertDate(entryDate, alert, now);
  if (!firstDate) {
    return [];
  }

  const intervalDays = Math.max(1, alert.offsetDays);

  return Array.from({ length: count }, (_, index) => addDays(firstDate, intervalDays * index));
};
