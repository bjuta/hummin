import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext
) {
  const stream = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    { onError(error: unknown) { console.error("SSR rendering failure", error); responseStatusCode = 500; } }
  );
  if (isbot(request.headers.get("user-agent") || "")) await stream.allReady;
  responseHeaders.set("Content-Type", "text/html; charset=utf-8");
  responseHeaders.set("X-Content-Type-Options", "nosniff");
  responseHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return new Response(stream, { status: responseStatusCode, headers: responseHeaders });
}
