import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({ path: ".env.local" });

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Store Backend 2026 listening on http://localhost:${port}`);
});
