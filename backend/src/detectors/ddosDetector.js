// backend/src/detectors/ddosDetector.js

export function detectDdos(aggregations, threshold = 50) {
  const buckets =
    aggregations?.nginx_by_ip?.by_ip?.buckets || [];

  const attackers = buckets
    .filter(bucket => bucket.doc_count >= threshold)
    .map(bucket => bucket.key);

  return {
    count: attackers.length,
    ips: attackers
  };
}
