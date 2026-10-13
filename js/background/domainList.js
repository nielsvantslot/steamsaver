// A set of domains that also matches their subdomains.
export class DomainList {
  #domains;

  constructor(domains) {
    this.#domains = domains;
  }

  includes(hostname) {
    return this.#domains.some((domain) => hostname === domain || hostname.endsWith('.' + domain));
  }
}
