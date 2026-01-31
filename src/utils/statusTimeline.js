/** Status flow: Reported → Assigned → In Progress → Resolved → Closed */
export const STATUS_FLOW = [
  { label: "Reported", key: "reported" },
  { label: "Assigned", key: "assigned" },
  { label: "In Progress", key: "in_progress" },
  { label: "Resolved", key: "resolved" },
  { label: "Closed", key: "closed" },
];

const normalizeStatus = (s) => {
  if (!s || typeof s !== "string") return null;
  const lower = s.toLowerCase().replace(/\s+/g, "_");
  if (lower === "inprogress") return "in_progress";
  return lower;
};

/** Build timeline items with active flags up to and including current status. */
export const getStatusTimeline = (currentStatus, options = {}) => {
  const normalized = normalizeStatus(currentStatus);
  const currentIndex = STATUS_FLOW.findIndex((s) => s.key === normalized);
  const upTo = currentIndex >= 0 ? currentIndex : 0;
  const { timestamp } = options;
  return STATUS_FLOW.map((step, index) => ({
    label: step.label,
    active: index <= upTo,
    timestamp: index === upTo ? timestamp || "Current" : null,
  }));
};

/** Announcements: Draft → Published */
const ANNOUNCEMENT_FLOW = [
  { label: "Draft", key: "draft" },
  { label: "Published", key: "published" },
];
export const getAnnouncementTimeline = (currentStatus, options = {}) => {
  const normalized = (currentStatus || "published").toString().toLowerCase();
  const currentIndex = ANNOUNCEMENT_FLOW.findIndex((s) => s.key === normalized);
  const upTo = currentIndex >= 0 ? currentIndex : 1;
  const { timestamp } = options;
  return ANNOUNCEMENT_FLOW.map((step, index) => ({
    label: step.label,
    active: index <= upTo,
    timestamp: index === upTo ? timestamp || "Current" : null,
  }));
};

/** Lost items: Lost → Claimed (or Found) */
const LOST_ITEM_FLOW = [
  { label: "Lost", key: "lost" },
  { label: "Claimed", key: "claimed" },
];
export const getLostItemTimeline = (currentStatus, options = {}) => {
  const normalized = (currentStatus || "lost").toString().toLowerCase();
  const steps = normalized === "found"
    ? [{ label: "Lost", key: "lost" }, { label: "Found", key: "found" }]
    : LOST_ITEM_FLOW;
  const currentIndex = steps.findIndex((s) => s.key === normalized);
  const upTo = currentIndex >= 0 ? currentIndex : 0;
  const { timestamp } = options;
  return steps.map((step, index) => ({
    label: step.label,
    active: index <= upTo,
    timestamp: index === upTo ? timestamp || "Current" : null,
  }));
};

/** Complaints: Submitted → Under Review → Closed */
const COMPLAINT_FLOW = [
  { label: "Submitted", key: "submitted" },
  { label: "Under Review", key: "under_review" },
  { label: "Closed", key: "closed" },
];
export const getComplaintTimeline = (currentStatus, options = {}) => {
  const normalized = (currentStatus || "submitted").toString().toLowerCase().replace(/\s+/g, "_");
  const currentIndex = COMPLAINT_FLOW.findIndex((s) => s.key === normalized);
  const upTo = currentIndex >= 0 ? currentIndex : 0;
  const { timestamp } = options;
  return COMPLAINT_FLOW.map((step, index) => ({
    label: step.label,
    active: index <= upTo,
    timestamp: index === upTo ? timestamp || "Current" : null,
  }));
};
