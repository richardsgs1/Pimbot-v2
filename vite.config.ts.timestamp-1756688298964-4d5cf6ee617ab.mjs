// vite.config.ts
import { defineConfig } from "file:///C:/Users/richa/OneDrive/Documents/Projects/Pimbot-v2/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/richa/OneDrive/Documents/Projects/Pimbot-v2/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "node:path";
import process from "node:process";
import dotenv from "file:///C:/Users/richa/OneDrive/Documents/Projects/Pimbot-v2/node_modules/dotenv/lib/main.js";
import { GoogleGenAI } from "file:///C:/Users/richa/OneDrive/Documents/Projects/Pimbot-v2/node_modules/@google/genai/dist/node/index.mjs";
dotenv.config();
if (!process.env.API_KEY) {
  throw new Error("API_KEY is not defined in your .env file. Please create one and add your API key.");
}
var ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("error", reject);
    req.on("end", () => {
      if (!body)
        return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error("Invalid JSON body"));
      }
    });
  });
}
var apiPlugin = {
  name: "vercel-api-middleware",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url || !req.url.startsWith("/api/")) {
        return next();
      }
      const apiRoute = req.url.substring(4);
      const filePath = path.join(process.cwd(), "api", `${apiRoute}.ts`);
      try {
        const module = await server.ssrLoadModule(filePath);
        const handler = module.default;
        if (typeof handler !== "function") {
          res.statusCode = 500;
          return res.end(`Handler not found in ${filePath}`);
        }
        const vercelReq = req;
        vercelReq.body = await parseBody(req);
        vercelReq.ai = ai;
        const vercelRes = res;
        const originalEnd = res.end.bind(res);
        vercelRes.status = (statusCode) => {
          res.statusCode = statusCode;
          return vercelRes;
        };
        vercelRes.json = (data) => {
          res.setHeader("Content-Type", "application/json");
          originalEnd(JSON.stringify(data));
          return vercelRes;
        };
        await handler(vercelReq, vercelRes);
      } catch (error) {
        console.error(`API Error for ${req.url}:`, error);
        res.statusCode = 500;
        res.end(error instanceof Error ? error.message : "Internal Server Error");
      }
    });
  }
};
var vite_config_default = defineConfig({
  plugins: [react(), apiPlugin]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxyaWNoYVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudHNcXFxcUHJvamVjdHNcXFxcUGltYm90LXYyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxyaWNoYVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudHNcXFxcUHJvamVjdHNcXFxcUGltYm90LXYyXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9yaWNoYS9PbmVEcml2ZS9Eb2N1bWVudHMvUHJvamVjdHMvUGltYm90LXYyL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbi8vIEZpeDogSW1wb3J0IGBwcm9jZXNzYCB0byBnZXQgY29ycmVjdCBOb2RlLmpzIHR5cGluZ3MgZm9yIGBwcm9jZXNzLmN3ZCgpYCBhbmQgYHByb2Nlc3MuZW52YC5cbmltcG9ydCBwcm9jZXNzIGZyb20gJ25vZGU6cHJvY2Vzcyc7XG5pbXBvcnQgZG90ZW52IGZyb20gJ2RvdGVudic7XG5pbXBvcnQgdHlwZSB7IFZpdGVEZXZTZXJ2ZXIsIENvbm5lY3QgfSBmcm9tICd2aXRlJztcbmltcG9ydCB0eXBlIHsgVmVyY2VsUmVxdWVzdCwgVmVyY2VsUmVzcG9uc2UgfSBmcm9tICdAdmVyY2VsL25vZGUnO1xuaW1wb3J0IHsgR29vZ2xlR2VuQUkgfSBmcm9tICdAZ29vZ2xlL2dlbmFpJztcblxuLy8gLS0tIERFRklOSVRJVkUgRklYIC0tLVxuLy8gRXhwbGljaXRseSBsb2FkIGVudmlyb25tZW50IHZhcmlhYmxlcyBmcm9tIHRoZSAuZW52IGZpbGUgYXQgdGhlIHZlcnkgc3RhcnQuXG4vLyBUaGlzIG1ha2VzIHRoZSBBUElfS0VZIGF2YWlsYWJsZSB0byB0aGUgc2VydmVyIGVudmlyb25tZW50LlxuZG90ZW52LmNvbmZpZygpO1xuXG4vLyAtLS0gTkVXIEFSQ0hJVEVDVFVSRSAtLS1cbi8vIEluaXRpYWxpemUgdGhlIEFJIGNsaWVudCBPTkNFLlxuLy8gVGhpcyBpcyB0aGUgc2luZ2xlIHNvdXJjZSBvZiB0cnV0aCBmb3IgdGhlIEFJIGNvbm5lY3Rpb24uXG5pZiAoIXByb2Nlc3MuZW52LkFQSV9LRVkpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiQVBJX0tFWSBpcyBub3QgZGVmaW5lZCBpbiB5b3VyIC5lbnYgZmlsZS4gUGxlYXNlIGNyZWF0ZSBvbmUgYW5kIGFkZCB5b3VyIEFQSSBrZXkuXCIpO1xufVxuY29uc3QgYWkgPSBuZXcgR29vZ2xlR2VuQUkoeyBhcGlLZXk6IHByb2Nlc3MuZW52LkFQSV9LRVkgfSk7XG5cblxuLy8gSGVscGVyIHRvIHBhcnNlIHRoZSByZXF1ZXN0IGJvZHkuXG5hc3luYyBmdW5jdGlvbiBwYXJzZUJvZHkocmVxOiBDb25uZWN0LkluY29taW5nTWVzc2FnZSk6IFByb21pc2U8YW55PiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IGJvZHkgPSAnJztcbiAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7IGJvZHkgKz0gY2h1bmsudG9TdHJpbmcoKTsgfSk7XG4gICAgcmVxLm9uKCdlcnJvcicsIHJlamVjdCk7XG4gICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICBpZiAoIWJvZHkpIHJldHVybiByZXNvbHZlKHt9KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc29sdmUoSlNPTi5wYXJzZShib2R5KSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgSlNPTiBib2R5JykpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn1cblxuLy8gVml0ZSBwbHVnaW4gdG8gaGFuZGxlIC9hcGkvKiByb3V0ZXNcbmNvbnN0IGFwaVBsdWdpbiA9IHtcbiAgbmFtZTogJ3ZlcmNlbC1hcGktbWlkZGxld2FyZScsXG4gIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXI6IFZpdGVEZXZTZXJ2ZXIpIHtcbiAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgaWYgKCFyZXEudXJsIHx8ICFyZXEudXJsLnN0YXJ0c1dpdGgoJy9hcGkvJykpIHtcbiAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYXBpUm91dGUgPSByZXEudXJsLnN1YnN0cmluZyg0KTtcbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdhcGknLCBgJHthcGlSb3V0ZX0udHNgKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgbW9kdWxlID0gYXdhaXQgc2VydmVyLnNzckxvYWRNb2R1bGUoZmlsZVBhdGgpO1xuICAgICAgICBjb25zdCBoYW5kbGVyID0gbW9kdWxlLmRlZmF1bHQ7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoYEhhbmRsZXIgbm90IGZvdW5kIGluICR7ZmlsZVBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB2ZXJjZWxSZXEgPSByZXEgYXMgVmVyY2VsUmVxdWVzdCAmIHsgYWk6IEdvb2dsZUdlbkFJIH07XG4gICAgICAgIHZlcmNlbFJlcS5ib2R5ID0gYXdhaXQgcGFyc2VCb2R5KHJlcSk7XG4gICAgICAgIFxuICAgICAgICAvLyAtLS0gTkVXOiBJbmplY3QgdGhlIHNoYXJlZCBBSSBjbGllbnQgaW50byB0aGUgcmVxdWVzdCAtLS1cbiAgICAgICAgdmVyY2VsUmVxLmFpID0gYWk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCB2ZXJjZWxSZXMgPSByZXMgYXMgVmVyY2VsUmVzcG9uc2U7XG4gICAgICAgIFxuICAgICAgICAvLyBBZGQgY29tcGF0aWJpbGl0eSBtZXRob2RzIHRvIFZpdGUncyByZXNwb25zZSBvYmplY3RcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxFbmQgPSByZXMuZW5kLmJpbmQocmVzKTtcbiAgICAgICAgdmVyY2VsUmVzLnN0YXR1cyA9IChzdGF0dXNDb2RlOiBudW1iZXIpID0+IHtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IHN0YXR1c0NvZGU7XG4gICAgICAgICAgcmV0dXJuIHZlcmNlbFJlcztcbiAgICAgICAgfTtcbiAgICAgICAgdmVyY2VsUmVzLmpzb24gPSAoZGF0YTogYW55KSA9PiB7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICBvcmlnaW5hbEVuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICAgICAgcmV0dXJuIHZlcmNlbFJlcztcbiAgICAgICAgfTtcblxuICAgICAgICBhd2FpdCBoYW5kbGVyKHZlcmNlbFJlcSwgdmVyY2VsUmVzKTtcblxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgQVBJIEVycm9yIGZvciAke3JlcS51cmx9OmAsIGVycm9yKTtcbiAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgIHJlcy5lbmQoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnSW50ZXJuYWwgU2VydmVyIEVycm9yJyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG59O1xuXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpLCBhcGlQbHVnaW5dLFxufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUE0VixTQUFTLG9CQUFvQjtBQUN6WCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBRWpCLE9BQU8sYUFBYTtBQUNwQixPQUFPLFlBQVk7QUFHbkIsU0FBUyxtQkFBbUI7QUFLNUIsT0FBTyxPQUFPO0FBS2QsSUFBSSxDQUFDLFFBQVEsSUFBSSxTQUFTO0FBQ3hCLFFBQU0sSUFBSSxNQUFNLG1GQUFtRjtBQUNyRztBQUNBLElBQU0sS0FBSyxJQUFJLFlBQVksRUFBRSxRQUFRLFFBQVEsSUFBSSxRQUFRLENBQUM7QUFJMUQsZUFBZSxVQUFVLEtBQTRDO0FBQ25FLFNBQU8sSUFBSSxRQUFRLENBQUMsU0FBUyxXQUFXO0FBQ3RDLFFBQUksT0FBTztBQUNYLFFBQUksR0FBRyxRQUFRLFdBQVM7QUFBRSxjQUFRLE1BQU0sU0FBUztBQUFBLElBQUcsQ0FBQztBQUNyRCxRQUFJLEdBQUcsU0FBUyxNQUFNO0FBQ3RCLFFBQUksR0FBRyxPQUFPLE1BQU07QUFDbEIsVUFBSSxDQUFDO0FBQU0sZUFBTyxRQUFRLENBQUMsQ0FBQztBQUM1QixVQUFJO0FBQ0YsZ0JBQVEsS0FBSyxNQUFNLElBQUksQ0FBQztBQUFBLE1BQzFCLFNBQVMsR0FBRztBQUNWLGVBQU8sSUFBSSxNQUFNLG1CQUFtQixDQUFDO0FBQUEsTUFDdkM7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNILENBQUM7QUFDSDtBQUdBLElBQU0sWUFBWTtBQUFBLEVBQ2hCLE1BQU07QUFBQSxFQUNOLGdCQUFnQixRQUF1QjtBQUNyQyxXQUFPLFlBQVksSUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTO0FBQy9DLFVBQUksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLElBQUksV0FBVyxPQUFPLEdBQUc7QUFDNUMsZUFBTyxLQUFLO0FBQUEsTUFDZDtBQUVBLFlBQU0sV0FBVyxJQUFJLElBQUksVUFBVSxDQUFDO0FBQ3BDLFlBQU0sV0FBVyxLQUFLLEtBQUssUUFBUSxJQUFJLEdBQUcsT0FBTyxHQUFHLFFBQVEsS0FBSztBQUVqRSxVQUFJO0FBQ0YsY0FBTSxTQUFTLE1BQU0sT0FBTyxjQUFjLFFBQVE7QUFDbEQsY0FBTSxVQUFVLE9BQU87QUFFdkIsWUFBSSxPQUFPLFlBQVksWUFBWTtBQUNqQyxjQUFJLGFBQWE7QUFDakIsaUJBQU8sSUFBSSxJQUFJLHdCQUF3QixRQUFRLEVBQUU7QUFBQSxRQUNuRDtBQUVBLGNBQU0sWUFBWTtBQUNsQixrQkFBVSxPQUFPLE1BQU0sVUFBVSxHQUFHO0FBR3BDLGtCQUFVLEtBQUs7QUFFZixjQUFNLFlBQVk7QUFHbEIsY0FBTSxjQUFjLElBQUksSUFBSSxLQUFLLEdBQUc7QUFDcEMsa0JBQVUsU0FBUyxDQUFDLGVBQXVCO0FBQ3pDLGNBQUksYUFBYTtBQUNqQixpQkFBTztBQUFBLFFBQ1Q7QUFDQSxrQkFBVSxPQUFPLENBQUMsU0FBYztBQUM5QixjQUFJLFVBQVUsZ0JBQWdCLGtCQUFrQjtBQUNoRCxzQkFBWSxLQUFLLFVBQVUsSUFBSSxDQUFDO0FBQ2hDLGlCQUFPO0FBQUEsUUFDVDtBQUVBLGNBQU0sUUFBUSxXQUFXLFNBQVM7QUFBQSxNQUVwQyxTQUFTLE9BQU87QUFDZCxnQkFBUSxNQUFNLGlCQUFpQixJQUFJLEdBQUcsS0FBSyxLQUFLO0FBQ2hELFlBQUksYUFBYTtBQUNqQixZQUFJLElBQUksaUJBQWlCLFFBQVEsTUFBTSxVQUFVLHVCQUF1QjtBQUFBLE1BQzFFO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUNGO0FBR0EsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxTQUFTO0FBQzlCLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
