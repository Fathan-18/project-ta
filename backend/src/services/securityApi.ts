export interface EventsPerHour {
  key_as_string: string;
  key: number;
  doc_count: number;
  ssh_failures: { doc_count: number };
  nginx_requests: { doc_count: number };
}

export interface SecuritySummary {
  bruteForce: number;
  ddos: number;
  authFailures: number;
  totalEvents: number;
  eventsPerHour: EventsPerHour[];
}

export const fetchSecuritySummary = async (): Promise<SecuritySummary> => {
  const res = await fetch("http://10.10.10.1:3001/api/security-summary");
  
  if (!res.ok) {
    throw new Error("Failed to fetch security summary");
  }

  return res.json();
};

