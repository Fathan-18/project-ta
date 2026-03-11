export function detectDdos(aggregations, threshold = 50) {
  const result = {
    count: 0,
    events: []
  };

  const buckets =
    aggregations?.nginx_by_ip?.by_ip?.buckets || [];

  buckets.forEach(ipBucket => {
    const ip = ipBucket.key;
    const minuteBuckets =
      ipBucket.per_minute?.buckets || [];

    minuteBuckets.forEach(minute => {
      if (minute.doc_count >= threshold) {
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
