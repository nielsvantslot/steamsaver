// Wires the background script together. Everything with logic lives in its own module.
import { HostClassifier } from './HostClassifier.js';
import { BadgePresenter } from './BadgePresenter.js';
import { BannerPresenter } from './BannerPresenter.js';
import { FooterScanner } from './FooterScanner.js';
import { TabGuard } from './TabGuard.js';

const engine = globalThis.browser ?? globalThis.chrome;

new TabGuard({
  tabs: engine.tabs,
  runtime: engine.runtime,
  classifier: HostClassifier.withDefaultRules(),
  presenters: [new BadgePresenter(engine.action), new BannerPresenter(engine.scripting)],
  footerScanner: new FooterScanner(engine.scripting),
}).start();
