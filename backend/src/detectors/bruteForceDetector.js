export function detectBruteForce(aggregations, threshold = 5) {

  const result = {
    count: 0,
    ips: []
  };

  const buckets =
    aggregations?.ssh_activity?.by_ip?.buckets || [];

  buckets.forEach(ipBucket => {

    const ip = ipBucket.key;
    const minuteBuckets =
      ipBucket.per_minute?.buckets || [];

    const hasBruteForce = minuteBuckets.some(minute => {

      const failureCount =
        minute.failures?.doc_count || 0;

      const successCount =
        minute.success?.doc_count || 0;

      return (
        failureCount >= threshold &&
        successCount === 0
      );

    });

    if (hasBruteForce) {
      result.count++;
      result.ips.push(ip);
    }

  });

  return result;
}
