import dns from "node:dns";
import net from "node:net";

/**
 * Neon (and many cloud Postgres hosts) publish AAAA records this machine cannot
 * reach. Node's default dual-stack connect then fails as a blank ETIMEDOUT
 * AggregateError (~800ms) instead of using IPv4.
 */
dns.setDefaultResultOrder("ipv4first");
if (typeof net.setDefaultAutoSelectFamily === "function") {
  net.setDefaultAutoSelectFamily(false);
}
