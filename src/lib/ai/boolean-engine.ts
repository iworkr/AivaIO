import type { SupervisorResult } from "@/app/api/ai/supervisor/route";

interface GateContext {
  userSettings: {
    autoSendEnabled: boolean;
    confidenceThreshold: number;
    workingHoursStart: number;
    workingHoursEnd: number;
    allowAfterHours: boolean;
  };
  channelSettings: {
    autoSendEnabled: boolean;
  };
  contact: {
    messageCount: number;
    isNew: boolean;
    isVIP: boolean;
    sentimentScore: number;
  };
  supervisor: SupervisorResult;
  currentHour: number;
}

interface GateResult {
  gate: string;
  passed: boolean;
  detail: string;
}

const FORBIDDEN_PATTERNS = [
  /\b(price|pricing|cost|invoice|billing)\b/i,
  /\b(contract|agreement|terms|legal|sue|lawsuit)\b/i,
  /\b(refund|return|exchange|credit)\b/i,
  /\$\d+/,
];

const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

export function evaluateAllGates(
  draftText: string,
  context: GateContext,
  userId: string
): { passed: boolean; results: GateResult[]; riskReason?: string } {
  const results: GateResult[] = [];

  // Gate 1: Global & Channel Feature Flag
  const gate1 = context.userSettings.autoSendEnabled && context.channelSettings.autoSendEnabled;
  results.push({
    gate: "Gate 1: Feature Flag",
    passed: gate1,
    detail: gate1 ? "Auto-send enabled" : "Auto-send disabled by user or channel settings",
  });

  // Gate 2: Confidence Threshold
  const gate2 = context.supervisor.confidenceScore >= context.userSettings.confidenceThreshold;
  results.push({
    gate: "Gate 2: Confidence",
    passed: gate2,
    detail: `Score ${context.supervisor.confidenceScore.toFixed(2)} ${gate2 ? ">=" : "<"} threshold ${context.userSettings.confidenceThreshold.toFixed(2)}`,
  });

  // Gate 3: Supervisor SAFE_TO_SEND
  results.push({
    gate: "Gate 3: Supervisor",
    passed: context.supervisor.safeToSend,
    detail: context.supervisor.reasoning || (context.supervisor.safeToSend ? "Safe to send" : "Supervisor flagged as unsafe"),
  });

  // Gate 4: First-Touch Block
  const gate4 = context.contact.messageCount > 0 && !context.contact.isNew;
  results.push({
    gate: "Gate 4: First Touch",
    passed: gate4,
    detail: gate4 ? "Established contact" : "First-touch contact - human must respond first",
  });

  // Gate 5: Complexity Constraint
  const gate5 = context.supervisor.messageType === "ACKNOWLEDGEMENT" || context.supervisor.messageType === "CONFIRMATION";
  results.push({
    gate: "Gate 5: Complexity",
    passed: gate5,
    detail: `Message type: ${context.supervisor.messageType}`,
  });

  // Gate 6: Forbidden Topic Filter
  const forbiddenMatches = FORBIDDEN_PATTERNS.filter((p) => p.test(draftText));
  const gate6 = forbiddenMatches.length === 0 && !context.supervisor.hasForbiddenTopics;
  results.push({
    gate: "Gate 6: Forbidden Topics",
    passed: gate6,
    detail: gate6 ? "No forbidden topics" : `Matched: ${context.supervisor.forbiddenTopicsFound?.join(", ") || "regex pattern"}`,
  });

  // Gate 7: Scheduling Ambiguity
  const gate7 = context.supervisor.isSchedulingUnambiguous !== false;
  results.push({
    gate: "Gate 7: Scheduling",
    passed: gate7,
    detail: gate7 ? "No scheduling ambiguity" : "Scheduling details are ambiguous",
  });

  // Gate 8: No New Promises
  const gate8 = !context.supervisor.containsNewCommitments;
  results.push({
    gate: "Gate 8: No Promises",
    passed: gate8,
    detail: gate8 ? "No new commitments" : "Draft introduces new commitments not in context",
  });

  // Gate 9: Time Window
  const withinHours = context.currentHour >= context.userSettings.workingHoursStart &&
    context.currentHour <= context.userSettings.workingHoursEnd;
  const gate9 = withinHours || context.userSettings.allowAfterHours;
  results.push({
    gate: "Gate 9: Time Window",
    passed: gate9,
    detail: gate9 ? "Within working hours" : `Outside hours (${context.currentHour}:00)`,
  });

  // Gate 10: Attachment Request
  const gate10 = !context.supervisor.senderRequestedAttachment;
  results.push({
    gate: "Gate 10: Attachments",
    passed: gate10,
    detail: gate10 ? "No attachment requested" : "Sender requested an attachment AIVA cannot provide",
  });

  // Rate limiting
  const now = Date.now();
  let rateEntry = RATE_LIMIT_MAP.get(userId);
  if (!rateEntry || rateEntry.resetAt < now) {
    rateEntry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
    RATE_LIMIT_MAP.set(userId, rateEntry);
  }

  const withinRateLimit = rateEntry.count < RATE_LIMIT_MAX;
  if (withinRateLimit) rateEntry.count++;

  const allPassed = results.every((r) => r.passed) && withinRateLimit;
  const firstFailed = results.find((r) => !r.passed);

  return {
    passed: allPassed,
    results,
    riskReason: !withinRateLimit
      ? "RATE_LIMIT_EXCEEDED"
      : firstFailed ? firstFailed.detail : undefined,
  };
}

export function checkVIPHardBlock(contact: { isVIP: boolean; sentimentScore: number }): {
  blocked: boolean;
  reason?: string;
} {
  if (contact.isVIP) {
    return { blocked: true, reason: "VIP_MANUAL_OVERRIDE" };
  }
  if (contact.sentimentScore < 0.3) {
    return { blocked: true, reason: "NEGATIVE_SENTIMENT_DETECTED" };
  }
  return { blocked: false };
}
