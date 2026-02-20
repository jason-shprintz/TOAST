import { Share } from 'react-native';
import { RallyPoint, CommunicationPlan } from '../../stores';

const RALLY_POINTS_TYPE = 'toast-rally-points';
const COMM_PLAN_TYPE = 'toast-comm-plan';
const VERSION = 1;

interface RallyPointsPayload {
  type: typeof RALLY_POINTS_TYPE;
  version: number;
  data: Array<{ name: string; description: string; coordinates?: string }>;
}

interface CommPlanPayload {
  type: typeof COMM_PLAN_TYPE;
  version: number;
  data: {
    whoCallsWhom: string;
    ifPhonesDown: string;
    outOfAreaContact: string;
    checkInSchedule: string;
  };
}

/**
 * Serializes the given rally points and opens the native share sheet.
 * Recipients can paste the shared text into the app's import dialog.
 */
export async function shareRallyPoints(
  rallyPoints: RallyPoint[],
): Promise<void> {
  const payload: RallyPointsPayload = {
    type: RALLY_POINTS_TYPE,
    version: VERSION,
    data: rallyPoints.map(({ name, description, coordinates }) => ({
      name,
      description,
      ...(coordinates ? { coordinates } : {}),
    })),
  };
  const text = JSON.stringify(payload);
  await Share.share({ message: text, title: 'TOAST Rally Points' });
}

/**
 * Serializes the communication plan and opens the native share sheet.
 * Recipients can paste the shared text into the app's import dialog.
 */
export async function shareCommunicationPlan(
  plan: CommunicationPlan,
): Promise<void> {
  const payload: CommPlanPayload = {
    type: COMM_PLAN_TYPE,
    version: VERSION,
    data: {
      whoCallsWhom: plan.whoCallsWhom,
      ifPhonesDown: plan.ifPhonesDown,
      outOfAreaContact: plan.outOfAreaContact,
      checkInSchedule: plan.checkInSchedule,
    },
  };
  const text = JSON.stringify(payload);
  await Share.share({ message: text, title: 'TOAST Communication Plan' });
}

/**
 * Parses a shared rally-points JSON string.
 * Returns the array of rally point stubs on success, or `null` if the
 * payload is malformed or has an unexpected type/version.
 */
export function parseSharedRallyPoints(
  raw: string,
): RallyPointsPayload['data'] | null {
  try {
    const parsed = JSON.parse(raw.trim()) as RallyPointsPayload;
    if (parsed.type !== RALLY_POINTS_TYPE || parsed.version !== VERSION) {
      return null;
    }
    if (!Array.isArray(parsed.data)) {
      return null;
    }
    // Basic shape validation
    const valid = parsed.data.every(
      (item) =>
        typeof item.name === 'string' && typeof item.description === 'string',
    );
    return valid ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Parses a shared communication-plan JSON string.
 * Returns the plan data on success, or `null` if the payload is malformed.
 */
export function parseSharedCommunicationPlan(
  raw: string,
): CommPlanPayload['data'] | null {
  try {
    const parsed = JSON.parse(raw.trim()) as CommPlanPayload;
    if (parsed.type !== COMM_PLAN_TYPE || parsed.version !== VERSION) {
      return null;
    }
    const d = parsed.data;
    if (
      typeof d.whoCallsWhom !== 'string' ||
      typeof d.ifPhonesDown !== 'string' ||
      typeof d.outOfAreaContact !== 'string' ||
      typeof d.checkInSchedule !== 'string'
    ) {
      return null;
    }
    return d;
  } catch {
    return null;
  }
}
