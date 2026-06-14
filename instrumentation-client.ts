import * as Sentry from "@sentry/nextjs";
import { getSentryDsn } from "./src/lib/ops/sentry-dsn";

const dsn = getSentryDsn();

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.data) {
        delete event.request.data;
      }
      return event;
    },
  });
}

export { captureRouterTransitionStart as onRouterTransitionStart } from "@sentry/nextjs";
