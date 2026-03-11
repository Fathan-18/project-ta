export function detectBruteForce(aggregations, threshold = 5) {

  const result = {
    count: 0,
    events: []
  };

  const buckets =
    aggregations?.ssh_activity?.by_ip?.buckets || [];

  buckets.forEach(ipBucket => {

    const ip = ipBucket.key;
    const minuteBuckets =
      ipBucket.per_minute?.buckets || [];

    minuteBuckets.forEach(minute => {

      const failureCount =
        minute.failures?.doc_count || 0;

      const successCount =
        minute.success?.doc_count || 0;

      if (
        failureCount >= threshold &&
        successCount === 0
      ) {
        result.count++;

        result.events.push({
          ip,
          timestamp: minute.key_as_string
        });
      }

    });

  });

  return result;
}
