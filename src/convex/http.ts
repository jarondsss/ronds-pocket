import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

/**
 * Security headers middleware
 * Adds common security headers to all HTTP responses
 * 
 * Note: Convex handles CORS automatically, but for custom routes
 * we ensure proper security headers are set.
 */
http.route({
  path: "/.well-known/security.txt",
  method: "GET",
  handler: async () => {
    return new Response(
      `Contact: jajangworj@gmail.com
Expires: 2027-12-31T23:59:59.000Z
Preferred-Languages: id, en
`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  },
});

export default http;
